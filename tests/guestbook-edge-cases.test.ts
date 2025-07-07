import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Guestbook Edge Cases and Stress Tests", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Message Content Edge Cases", () => {
    it("should handle special characters and symbols", () => {
      const specialContent = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
      const response = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8(specialContent)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(1));
      
      const message = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(1)],
        deployer
      );
      
      expect(message.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8(specialContent),
          timestamp: Cl.uint(simnet.blockHeight),
          likes: Cl.uint(0)
        })
      );
    });

    it("should handle newlines and whitespace", () => {
      const whitespaceContent = "  \n\t  Hello World  \n\t  ";
      const response = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8(whitespaceContent)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(1));
    });

    it("should handle mixed language content", () => {
      const mixedContent = "Hello مرحبا 你好 こんにちは Здравствуйте";
      const response = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8(mixedContent)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(1));
    });

    it("should handle content with quotes and escapes", () => {
      const quotedContent = 'He said "Hello" and she replied \'Hi!\'';
      const response = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8(quotedContent)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(1));
    });
  });

  describe("High Volume Operations", () => {
    it("should handle posting many messages sequentially", () => {
      const messageCount = 50;
      
      for (let i = 1; i <= messageCount; i++) {
        const response = simnet.callPublicFn(
          "guestbook",
          "post-message",
          [Cl.stringUtf8(`Message number ${i}`)],
          wallet1
        );
        expect(response.result).toBeOk(Cl.uint(i));
      }

      // Verify last message ID
      const lastMessageId = simnet.callReadOnlyFn(
        "guestbook",
        "get-last-message-id",
        [],
        deployer
      );
      expect(lastMessageId.result).toBeUint(messageCount);

      // Verify first and last messages
      const firstMessage = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(1)],
        deployer
      );
      expect(firstMessage.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8("Message number 1"),
          timestamp: Cl.uint(simnet.blockHeight - messageCount + 1),
          likes: Cl.uint(0)
        })
      );

      const lastMessage = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(messageCount)],
        deployer
      );
      expect(lastMessage.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8(`Message number ${messageCount}`),
          timestamp: Cl.uint(simnet.blockHeight),
          likes: Cl.uint(0)
        })
      );
    });

    it("should handle many likes on a single message", () => {
      // Post a message
      simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("Popular message")],
        wallet1
      );

      // Get all available accounts for liking
      const allAccounts = Array.from(accounts.values()).slice(1, 10); // Skip deployer
      
      // Each account likes the message
      allAccounts.forEach((account, index) => {
        const response = simnet.callPublicFn(
          "guestbook",
          "like-message",
          [Cl.uint(1)],
          account
        );
        expect(response.result).toBeOk(Cl.bool(true));
      });

      // Verify final like count
      const message = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(1)],
        deployer
      );
      
      expect(message.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8("Popular message"),
          timestamp: Cl.uint(simnet.blockHeight - allAccounts.length),
          likes: Cl.uint(allAccounts.length)
        })
      );
    });

    it("should handle multiple users posting simultaneously", () => {
      const users = [wallet1, wallet2, wallet3];
      const messagesPerUser = 10;

      // Each user posts multiple messages
      users.forEach((user, userIndex) => {
        for (let i = 1; i <= messagesPerUser; i++) {
          const messageId = userIndex * messagesPerUser + i;
          const response = simnet.callPublicFn(
            "guestbook",
            "post-message",
            [Cl.stringUtf8(`User ${userIndex + 1} message ${i}`)],
            user
          );
          expect(response.result).toBeOk(Cl.uint(messageId));
        }
      });

      // Verify total message count
      const lastMessageId = simnet.callReadOnlyFn(
        "guestbook",
        "get-last-message-id",
        [],
        deployer
      );
      expect(lastMessageId.result).toBeUint(users.length * messagesPerUser);
    });
  });

  describe("Boundary Value Testing", () => {
    it("should handle message ID at boundaries", () => {
      // Test with ID 0 (should not exist)
      const message0 = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(0)],
        deployer
      );
      expect(message0.result).toBeNone();

      // Test with very large ID (should not exist)
      const messageLarge = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(999999)],
        deployer
      );
      expect(messageLarge.result).toBeNone();

      // Test liking non-existent messages
      const likeResponse0 = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(0)],
        wallet1
      );
      expect(likeResponse0.result).toBeErr(Cl.uint(1));

      const likeResponseLarge = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(999999)],
        wallet1
      );
      expect(likeResponseLarge.result).toBeErr(Cl.uint(1));
    });

    it("should handle maximum uint values", () => {
      // Test with maximum uint value for message ID
      const maxUint = 2**32 - 1; // Maximum uint in Clarity
      
      const messageMax = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(maxUint)],
        deployer
      );
      expect(messageMax.result).toBeNone();

      const likeResponseMax = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(maxUint)],
        wallet1
      );
      expect(likeResponseMax.result).toBeErr(Cl.uint(1));
    });
  });

  describe("State Consistency Tests", () => {
    it("should maintain consistent state across multiple operations", () => {
      // Post messages and like them in a complex pattern
      const operations = [
        { action: "post", user: wallet1, content: "Message 1" },
        { action: "post", user: wallet2, content: "Message 2" },
        { action: "like", user: wallet2, messageId: 1 },
        { action: "post", user: wallet3, content: "Message 3" },
        { action: "like", user: wallet1, messageId: 2 },
        { action: "like", user: wallet3, messageId: 1 },
        { action: "like", user: wallet1, messageId: 3 },
      ];

      let expectedMessageCount = 0;
      const expectedLikes = { 1: 0, 2: 0, 3: 0 };

      operations.forEach((op) => {
        if (op.action === "post") {
          expectedMessageCount++;
          const response = simnet.callPublicFn(
            "guestbook",
            "post-message",
            [Cl.stringUtf8(op.content!)],
            op.user
          );
          expect(response.result).toBeOk(Cl.uint(expectedMessageCount));
        } else if (op.action === "like") {
          expectedLikes[op.messageId!]++;
          const response = simnet.callPublicFn(
            "guestbook",
            "like-message",
            [Cl.uint(op.messageId!)],
            op.user
          );
          expect(response.result).toBeOk(Cl.bool(true));
        }
      });

      // Verify final state
      const lastMessageId = simnet.callReadOnlyFn(
        "guestbook",
        "get-last-message-id",
        [],
        deployer
      );
      expect(lastMessageId.result).toBeUint(expectedMessageCount);

      // Verify like counts
      Object.entries(expectedLikes).forEach(([messageId, expectedLikeCount]) => {
        const message = simnet.callReadOnlyFn(
          "guestbook",
          "get-message",
          [Cl.uint(parseInt(messageId))],
          deployer
        );
        
        expect(message.result).toBeSome(
          Cl.tuple({
            author: Cl.principal(
              messageId === "1" ? wallet1 : 
              messageId === "2" ? wallet2 : wallet3
            ),
            content: Cl.stringUtf8(`Message ${messageId}`),
            timestamp: Cl.uint(simnet.blockHeight - (7 - parseInt(messageId))),
            likes: Cl.uint(expectedLikeCount)
          })
        );
      });
    });

    it("should handle interleaved operations correctly", () => {
      // Create a complex scenario with interleaved posts and likes
      simnet.callPublicFn("guestbook", "post-message", [Cl.stringUtf8("First")], wallet1);
      simnet.callPublicFn("guestbook", "like-message", [Cl.uint(1)], wallet2);
      simnet.callPublicFn("guestbook", "post-message", [Cl.stringUtf8("Second")], wallet2);
      simnet.callPublicFn("guestbook", "like-message", [Cl.uint(1)], wallet3);
      simnet.callPublicFn("guestbook", "like-message", [Cl.uint(2)], wallet1);
      simnet.callPublicFn("guestbook", "post-message", [Cl.stringUtf8("Third")], wallet3);

      // Verify state consistency
      const message1 = simnet.callReadOnlyFn("guestbook", "get-message", [Cl.uint(1)], deployer);
      expect(message1.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8("First"),
          timestamp: Cl.uint(simnet.blockHeight - 5),
          likes: Cl.uint(2)
        })
      );

      const message2 = simnet.callReadOnlyFn("guestbook", "get-message", [Cl.uint(2)], deployer);
      expect(message2.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet2),
          content: Cl.stringUtf8("Second"),
          timestamp: Cl.uint(simnet.blockHeight - 3),
          likes: Cl.uint(1)
        })
      );

      const message3 = simnet.callReadOnlyFn("guestbook", "get-message", [Cl.uint(3)], deployer);
      expect(message3.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet3),
          content: Cl.stringUtf8("Third"),
          timestamp: Cl.uint(simnet.blockHeight),
          likes: Cl.uint(0)
        })
      );
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle failed operations gracefully", () => {
      // Post a message
      simnet.callPublicFn("guestbook", "post-message", [Cl.stringUtf8("Test")], wallet1);

      // Try to like it twice with same user
      const firstLike = simnet.callPublicFn("guestbook", "like-message", [Cl.uint(1)], wallet2);
      expect(firstLike.result).toBeOk(Cl.bool(true));

      const secondLike = simnet.callPublicFn("guestbook", "like-message", [Cl.uint(1)], wallet2);
      expect(secondLike.result).toBeErr(Cl.uint(2));

      // Verify state wasn't corrupted
      const message = simnet.callReadOnlyFn("guestbook", "get-message", [Cl.uint(1)], deployer);
      expect(message.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8("Test"),
          timestamp: Cl.uint(simnet.blockHeight - 2),
          likes: Cl.uint(1)
        })
      );

      // Verify user can still perform other operations
      const newMessage = simnet.callPublicFn("guestbook", "post-message", [Cl.stringUtf8("New")], wallet2);
      expect(newMessage.result).toBeOk(Cl.uint(2));
    });
  });
});
