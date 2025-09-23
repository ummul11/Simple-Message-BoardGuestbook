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
 * Tipping Test Helper utilities for Tipping contract testing
 */
export class TippingTestHelpers {
  private accounts: Map<string, string>;

  constructor(accounts: Map<string, string>) {
    this.accounts = accounts;
  }

  /**
   * Send a tip and return the tip ID
   */
  sendTip(recipient: string, amount: number, messageId: number, sender: string): number {
    const lastTipId = this.getLastTipId();
    const expectedId = lastTipId + 1;

    const response = simnet.callPublicFn(
      "tipping",
      "send-tip",
      [Cl.principal(recipient), Cl.uint(amount), Cl.uint(messageId)],
      sender
    );

    if (!response.result.toString().includes(`(ok u${expectedId})`)) {
      throw new Error(`Failed to send tip: ${response.result}`);
    }

    return expectedId;
  }

  /**
   * Get the current last tip ID
   */
  getLastTipId(): number {
    const response = simnet.callReadOnlyFn(
      "tipping",
      "get-last-tip-id",
      [],
      this.accounts.get("deployer")!
    );

    const match = response.result.toString().match(/u(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Get tip details by ID
   */
  getTip(tipId: number) {
    return simnet.callReadOnlyFn(
      "tipping",
      "get-tip",
      [Cl.uint(tipId)],
      this.accounts.get("deployer")!
    );
  }

  /**
   * Get user tips received
   */
  getUserTipsReceived(user: string) {
    return simnet.callReadOnlyFn(
      "tipping",
      "get-user-tips-received",
      [Cl.principal(user)],
      this.accounts.get("deployer")!
    );
  }

  /**
   * Get user tips sent
   */
  getUserTipsSent(user: string) {
    return simnet.callReadOnlyFn(
      "tipping",
      "get-user-tips-sent",
      [Cl.principal(user)],
      this.accounts.get("deployer")!
    );
  }

  /**
   * Get STX balance for a user
   */
  getSTXBalance(user: string): number {
    const balance = simnet.getAssetsMap().get("STX");
    if (balance && balance.has(user)) {
      return Number(balance.get(user));
    }
    return 0;
  }

  /**
   * Verify tip structure and content
   */
  verifyTip(
    tipId: number,
    expectedSender: string,
    expectedRecipient: string,
    expectedAmount: number,
    expectedMessageId: number,
    expectedTimestamp?: number
  ): boolean {
    const tip = this.getTip(tipId);

    if (tip.result.toString().includes("none")) {
      return false;
    }

    const tipStr = tip.result.toString();

    // Check sender
    if (!tipStr.includes(expectedSender)) {
      console.error(`Sender mismatch. Expected: ${expectedSender}`);
      return false;
    }

    // Check recipient
    if (!tipStr.includes(expectedRecipient)) {
      console.error(`Recipient mismatch. Expected: ${expectedRecipient}`);
      return false;
    }

    // Check amount
    const amountMatch = tipStr.match(/amount: u(\d+)/);
    const actualAmount = amountMatch ? parseInt(amountMatch[1]) : 0;
    if (actualAmount !== expectedAmount) {
      console.error(`Amount mismatch. Expected: ${expectedAmount}, Actual: ${actualAmount}`);
      return false;
    }

    // Check message ID
    const messageIdMatch = tipStr.match(/message-id: u(\d+)/);
    const actualMessageId = messageIdMatch ? parseInt(messageIdMatch[1]) : 0;
    if (actualMessageId !== expectedMessageId) {
      console.error(`Message ID mismatch. Expected: ${expectedMessageId}, Actual: ${actualMessageId}`);
      return false;
    }

    // Check timestamp if provided
    if (expectedTimestamp !== undefined) {
      const timestampMatch = tipStr.match(/timestamp: u(\d+)/);
      const actualTimestamp = timestampMatch ? parseInt(timestampMatch[1]) : 0;
      if (actualTimestamp !== expectedTimestamp) {
        console.error(`Timestamp mismatch. Expected: ${expectedTimestamp}, Actual: ${actualTimestamp}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Verify user tip statistics
   */
  verifyUserTipStats(user: string, expectedReceived: number, expectedSent: number): boolean {
    const received = this.getUserTipsReceived(user);
    const sent = this.getUserTipsSent(user);

    const receivedStr = received.result.toString();
    const sentStr = sent.result.toString();

    const receivedMatch = receivedStr.match(/total-amount: u(\d+)/);
    const actualReceived = receivedMatch ? parseInt(receivedMatch[1]) : 0;

    const sentMatch = sentStr.match(/total-amount: u(\d+)/);
    const actualSent = sentMatch ? parseInt(sentMatch[1]) : 0;

    if (actualReceived !== expectedReceived) {
      console.error(`Tips received mismatch. Expected: ${expectedReceived}, Actual: ${actualReceived}`);
      return false;
    }

    if (actualSent !== expectedSent) {
      console.error(`Tips sent mismatch. Expected: ${expectedSent}, Actual: ${actualSent}`);
      return false;
    }

    return true;
  }

  /**
   * Create test scenario with multiple tips
   */
  createTipScenario(tips: Array<{
    sender: string,
    recipient: string,
    amount: number,
    messageId: number
  }>): number[] {
    const tipIds: number[] = [];

    tips.forEach(tip => {
      try {
        const tipId = this.sendTip(tip.recipient, tip.amount, tip.messageId, tip.sender);
        tipIds.push(tipId);
      } catch (error) {
        console.error(`Failed to send tip: ${error}`);
      }
    });

    return tipIds;
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

/**
 * Tipping error code constants
 */
export const TIPPING_ERROR_CODES = {
  INSUFFICIENT_BALANCE: 1,
  INVALID_AMOUNT: 2,
  SELF_TIP: 3,
  INVALID_RECIPIENT: 4
} as const;
