import { Cl } from "@stacks/transactions";

/**
 * Test helper utilities for Guestbook contract testing
 */

export class GuestbookTestHelpers {
  private accounts: Map<string, string>;

  constructor(accounts: Map<string, string>) {
    this.accounts = accounts;
  }

  /**
   * Post a message and return the expected message ID
   */
  postMessage(content: string, sender: string): number {
    const lastMessageId = this.getLastMessageId();
    const expectedId = lastMessageId + 1;
    
    const response = simnet.callPublicFn(
      "guestbook",
      "post-message",
      [Cl.stringUtf8(content)],
      sender
    );
    
    if (!response.result.toString().includes(`(ok u${expectedId})`)) {
      throw new Error(`Failed to post message: ${response.result}`);
    }
    
    return expectedId;
  }

  /**
   * Like a message and verify success
   */
  likeMessage(messageId: number, sender: string): boolean {
    const response = simnet.callPublicFn(
      "guestbook",
      "like-message",
      [Cl.uint(messageId)],
      sender
    );
    
    return response.result.toString().includes("(ok true)");
  }

  /**
   * Get the current last message ID
   */
  getLastMessageId(): number {
    const response = simnet.callReadOnlyFn(
      "guestbook",
      "get-last-message-id",
      [],
      this.accounts.get("deployer")!
    );
    
    const match = response.result.toString().match(/u(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get message details by ID
   */
  getMessage(messageId: number) {
    return simnet.callReadOnlyFn(
      "guestbook",
      "get-message",
      [Cl.uint(messageId)],
      this.accounts.get("deployer")!
    );
  }

  /**
   * Check if a user has liked a specific message
   */
  hasUserLiked(user: string, messageId: number): boolean {
    const response = simnet.callReadOnlyFn(
      "guestbook",
      "has-user-liked",
      [Cl.principal(user), Cl.uint(messageId)],
      this.accounts.get("deployer")!
    );
    
    return response.result.toString().includes("liked: true");
  }

  /**
   * Create multiple test messages with different users
   */
  createTestMessages(count: number, users: string[]): number[] {
    const messageIds: number[] = [];
    
    for (let i = 0; i < count; i++) {
      const user = users[i % users.length];
      const content = `Test message ${i + 1}`;
      const messageId = this.postMessage(content, user);
      messageIds.push(messageId);
    }
    
    return messageIds;
  }

  /**
   * Create a popular message with multiple likes
   */
  createPopularMessage(content: string, author: string, likers: string[]): number {
    const messageId = this.postMessage(content, author);
    
    likers.forEach(liker => {
      if (liker !== author || this.canAuthorLikeOwnMessage()) {
        this.likeMessage(messageId, liker);
      }
    });
    
    return messageId;
  }

  /**
   * Verify message structure and content
   */
  verifyMessage(
    messageId: number, 
    expectedAuthor: string, 
    expectedContent: string, 
    expectedLikes: number,
    expectedTimestamp?: number
  ): boolean {
    const message = this.getMessage(messageId);
    
    if (message.result.toString().includes("none")) {
      return false;
    }
    
    const messageStr = message.result.toString();
    
    // Check author
    if (!messageStr.includes(expectedAuthor)) {
      console.error(`Author mismatch. Expected: ${expectedAuthor}`);
      return false;
    }
    
    // Check content
    if (!messageStr.includes(expectedContent)) {
      console.error(`Content mismatch. Expected: ${expectedContent}`);
      return false;
    }
    
    // Check likes
    const likesMatch = messageStr.match(/likes: u(\d+)/);
    const actualLikes = likesMatch ? parseInt(likesMatch[1]) : 0;
    if (actualLikes !== expectedLikes) {
      console.error(`Likes mismatch. Expected: ${expectedLikes}, Actual: ${actualLikes}`);
      return false;
    }
    
    // Check timestamp if provided
    if (expectedTimestamp !== undefined) {
      const timestampMatch = messageStr.match(/timestamp: u(\d+)/);
      const actualTimestamp = timestampMatch ? parseInt(timestampMatch[1]) : 0;
      if (actualTimestamp !== expectedTimestamp) {
        console.error(`Timestamp mismatch. Expected: ${expectedTimestamp}, Actual: ${actualTimestamp}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Generate test content of various types
   */
  generateTestContent(): { [key: string]: string } {
    return {
      short: "Hi!",
      medium: "This is a medium-length message for testing purposes.",
      long: "A".repeat(280),
      unicode: "Hello 🌍! 你好世界 🚀 مرحبا",
      special: "!@#$%^&*()_+-=[]{}|;':\",./<>?`~",
      whitespace: "  \n\t  Whitespace test  \n\t  ",
      quotes: 'He said "Hello" and she replied \'Hi!\'',
      empty: "",
      numbers: "12345 67890 3.14159 -42",
      mixed: "Mixed content: 123 ABC 你好 🎉 !@#"
    };
  }

  /**
   * Simulate concurrent operations for stress testing
   */
  simulateConcurrentOperations(operations: Array<{
    type: "post" | "like",
    user: string,
    content?: string,
    messageId?: number
  }>): { successes: number, failures: number } {
    let successes = 0;
    let failures = 0;
    
    operations.forEach(op => {
      try {
        if (op.type === "post" && op.content) {
          this.postMessage(op.content, op.user);
          successes++;
        } else if (op.type === "like" && op.messageId) {
          const success = this.likeMessage(op.messageId, op.user);
          if (success) {
            successes++;
          } else {
            failures++;
          }
        }
      } catch (error) {
        failures++;
      }
    });
    
    return { successes, failures };
  }

  /**
   * Verify contract state consistency
   */
  verifyStateConsistency(): boolean {
    const lastMessageId = this.getLastMessageId();
    
    // Verify all messages from 1 to lastMessageId exist
    for (let i = 1; i <= lastMessageId; i++) {
      const message = this.getMessage(i);
      if (message.result.toString().includes("none")) {
        console.error(`Message ${i} should exist but doesn't`);
        return false;
      }
    }
    
    // Verify message beyond lastMessageId doesn't exist
    const nonExistentMessage = this.getMessage(lastMessageId + 1);
    if (!nonExistentMessage.result.toString().includes("none")) {
      console.error(`Message ${lastMessageId + 1} shouldn't exist but does`);
      return false;
    }
    
    return true;
  }

  /**
   * Get contract statistics for analysis
   */
  getContractStats(): {
    totalMessages: number,
    totalLikes: number,
    averageLikesPerMessage: number,
    messagesWithLikes: number
  } {
    const totalMessages = this.getLastMessageId();
    let totalLikes = 0;
    let messagesWithLikes = 0;
    
    for (let i = 1; i <= totalMessages; i++) {
      const message = this.getMessage(i);
      const messageStr = message.result.toString();
      const likesMatch = messageStr.match(/likes: u(\d+)/);
      const likes = likesMatch ? parseInt(likesMatch[1]) : 0;
      
      totalLikes += likes;
      if (likes > 0) {
        messagesWithLikes++;
      }
    }
    
    return {
      totalMessages,
      totalLikes,
      averageLikesPerMessage: totalMessages > 0 ? totalLikes / totalMessages : 0,
      messagesWithLikes
    };
  }

  /**
   * Reset contract state (for testing purposes)
   */
  resetState(): void {
    simnet.setEpoch("3.0");
  }

  /**
   * Check if authors can like their own messages (based on contract logic)
   */
  private canAuthorLikeOwnMessage(): boolean {
    // Based on the contract, there's no restriction preventing authors from liking their own messages
    return true;
  }
}

/**
 * Common test data generators
 */
export class TestDataGenerator {
  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static generateUnicodeString(): string {
    const unicodeChars = ['🚀', '🌍', '✨', '💫', '🎉', '你好', '世界', 'مرحبا', 'Здравствуйте'];
    return unicodeChars.join(' ');
  }

  static generateLongMessage(): string {
    return 'A'.repeat(280);
  }

  static generateTestUsers(accounts: Map<string, string>): string[] {
    return Array.from(accounts.values()).slice(1, 6); // Skip deployer, get first 5 wallets
  }
}

/**
 * Error code constants for better test readability
 */
export const ERROR_CODES = {
  MESSAGE_NOT_FOUND: 1,
  ALREADY_LIKED: 2,
  UNKNOWN_ERROR: 3
} as const;
