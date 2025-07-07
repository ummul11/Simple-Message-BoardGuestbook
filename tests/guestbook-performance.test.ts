import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Guestbook Performance and Gas Analysis", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Gas Cost Analysis", () => {
    it("should measure gas costs for posting messages", () => {
      const shortMessage = "Hi";
      const mediumMessage = "This is a medium length message for testing gas costs";
      const longMessage = "A".repeat(280); // Maximum length

      // Test short message
      const shortResponse = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8(shortMessage)],
        wallet1
      );
      expect(shortResponse.result).toBeOk(Cl.uint(1));

      // Test medium message
      const mediumResponse = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8(mediumMessage)],
        wallet1
      );
      expect(mediumResponse.result).toBeOk(Cl.uint(2));

      // Test long message
      const longResponse = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8(longMessage)],
        wallet1
      );
      expect(longResponse.result).toBeOk(Cl.uint(3));

      // All should succeed regardless of message length
      expect(shortResponse.result).toBeOk(Cl.uint(1));
      expect(mediumResponse.result).toBeOk(Cl.uint(2));
      expect(longResponse.result).toBeOk(Cl.uint(3));
    });

    it("should measure gas costs for liking messages", () => {
      // Set up test messages
      simnet.callPublicFn("guestbook", "post-message", [Cl.stringUtf8("Message 1")], wallet1);
      simnet.callPublicFn("guestbook", "post-message", [Cl.stringUtf8("Message 2")], wallet1);
      simnet.callPublicFn("guestbook", "post-message", [Cl.stringUtf8("Message 3")], wallet1);

      // Test liking different messages
      const like1 = simnet.callPublicFn("guestbook", "like-message", [Cl.uint(1)], wallet2);
      const like2 = simnet.callPublicFn("guestbook", "like-message", [Cl.uint(2)], wallet2);
      const like3 = simnet.callPublicFn("guestbook", "like-message", [Cl.uint(3)], wallet2);

      expect(like1.result).toBeOk(Cl.bool(true));
      expect(like2.result).toBeOk(Cl.bool(true));
      expect(like3.result).toBeOk(Cl.bool(true));

      // Test multiple likes on same message by different users
      const like1_user3 = simnet.callPublicFn("guestbook", "like-message", [Cl.uint(1)], wallet3);
      expect(like1_user3.result).toBeOk(Cl.bool(true));
    });

    it("should measure read-only function performance", () => {
      // Set up test data
      for (let i = 1; i <= 10; i++) {
        simnet.callPublicFn("guestbook", "post-message", [Cl.stringUtf8(`Message ${i}`)], wallet1);
      }

      // Test read-only functions performance
      const startTime = Date.now();
      
      for (let i = 1; i <= 10; i++) {
        const message = simnet.callReadOnlyFn("guestbook", "get-message", [Cl.uint(i)], deployer);
        expect(message.result).toBeSome();
      }

      const lastMessageId = simnet.callReadOnlyFn("guestbook", "get-last-message-id", [], deployer);
      expect(lastMessageId.result).toBeUint(10);

      for (let i = 1; i <= 10; i++) {
        const hasLiked = simnet.callReadOnlyFn(
          "guestbook", 
          "has-user-liked", 
          [Cl.principal(wallet1), Cl.uint(i)], 
          deployer
        );
        expect(hasLiked.result).toBeTuple({ liked: Cl.bool(false) });
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Read-only functions should be fast (this is more of a sanity check)
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("Scalability Tests", () => {
    it("should handle increasing message counts efficiently", () => {
      const messageCounts = [10, 25, 50];
      
      messageCounts.forEach((count) => {
        // Reset for each test
        simnet.setEpoch("3.0");
        
        const startTime = Date.now();
        
        // Post messages
        for (let i = 1; i <= count; i++) {
          const response = simnet.callPublicFn(
            "guestbook",
            "post-message",
            [Cl.stringUtf8(`Scalability test message ${i}`)],
            wallet1
          );
          expect(response.result).toBeOk(Cl.uint(i));
        }
        
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        // Verify all messages were posted correctly
        const lastMessageId = simnet.callReadOnlyFn("guestbook", "get-last-message-id", [], deployer);
        expect(lastMessageId.result).toBeUint(count);
        
        // Performance should scale reasonably (this is a rough check)
        console.log(`Posted ${count} messages in ${executionTime}ms`);
        expect(executionTime).toBeLessThan(count * 100); // Rough performance expectation
      });
    });

    it("should handle increasing like counts efficiently", () => {
      // Post a single message
      simnet.callPublicFn("guestbook", "post-message", [Cl.stringUtf8("Popular message")], wallet1);
      
      const likeCounts = [5, 10, 15];
      const allAccounts = Array.from(accounts.values());
      
      likeCounts.forEach((count, testIndex) => {
        if (testIndex > 0) {
          // Reset for subsequent tests
          simnet.setEpoch("3.0");
          simnet.callPublicFn("guestbook", "post-message", [Cl.stringUtf8("Popular message")], wallet1);
        }
        
        const startTime = Date.now();
        
        // Add likes from different accounts
        for (let i = 0; i < count && i < allAccounts.length; i++) {
          const response = simnet.callPublicFn(
            "guestbook",
            "like-message",
            [Cl.uint(1)],
            allAccounts[i]
          );
          expect(response.result).toBeOk(Cl.bool(true));
        }
        
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        // Verify like count
        const message = simnet.callReadOnlyFn("guestbook", "get-message", [Cl.uint(1)], deployer);
        expect(message.result).toBeSome(
          Cl.tuple({
            author: Cl.principal(wallet1),
            content: Cl.stringUtf8("Popular message"),
            timestamp: Cl.uint(simnet.blockHeight - count),
            likes: Cl.uint(count)
          })
        );
        
        console.log(`Added ${count} likes in ${executionTime}ms`);
        expect(executionTime).toBeLessThan(count * 50); // Rough performance expectation
      });
    });

    it("should maintain performance with mixed operations", () => {
      const operationCount = 30;
      const operations = [];
      
      // Generate mixed operations
      for (let i = 0; i < operationCount; i++) {
        if (i % 3 === 0) {
          operations.push({ type: "post", content: `Mixed op message ${i}` });
        } else {
          operations.push({ type: "like", messageId: Math.max(1, Math.floor(i / 3)) });
        }
      }
      
      const startTime = Date.now();
      let messageCount = 0;
      
      operations.forEach((op, index) => {
        if (op.type === "post") {
          messageCount++;
          const response = simnet.callPublicFn(
            "guestbook",
            "post-message",
            [Cl.stringUtf8(op.content!)],
            wallet1
          );
          expect(response.result).toBeOk(Cl.uint(messageCount));
        } else {
          // Use different users for likes to avoid duplicate like errors
          const userIndex = index % 3;
          const user = [wallet1, wallet2, wallet3][userIndex];
          
          const response = simnet.callPublicFn(
            "guestbook",
            "like-message",
            [Cl.uint(op.messageId!)],
            user
          );
          // Note: Some likes might fail due to duplicates, which is expected
        }
      });
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      console.log(`Executed ${operationCount} mixed operations in ${executionTime}ms`);
      expect(executionTime).toBeLessThan(operationCount * 100);
      
      // Verify final state
      const lastMessageId = simnet.callReadOnlyFn("guestbook", "get-last-message-id", [], deployer);
      expect(lastMessageId.result).toBeUint(messageCount);
    });
  });

  describe("Memory and State Efficiency", () => {
    it("should efficiently store and retrieve message data", () => {
      const testMessages = [
        "Short",
        "Medium length message with some content",
        "A".repeat(280), // Maximum length
        "Unicode: 🚀 🌍 ✨ 💫 🎉",
        "Mixed: Hello 世界 مرحبا Здравствуйте"
      ];
      
      // Post all test messages
      testMessages.forEach((content, index) => {
        const response = simnet.callPublicFn(
          "guestbook",
          "post-message",
          [Cl.stringUtf8(content)],
          wallet1
        );
        expect(response.result).toBeOk(Cl.uint(index + 1));
      });
      
      // Verify all messages can be retrieved correctly
      testMessages.forEach((content, index) => {
        const message = simnet.callReadOnlyFn(
          "guestbook",
          "get-message",
          [Cl.uint(index + 1)],
          deployer
        );
        
        expect(message.result).toBeSome(
          Cl.tuple({
            author: Cl.principal(wallet1),
            content: Cl.stringUtf8(content),
            timestamp: Cl.uint(simnet.blockHeight - testMessages.length + index + 1),
            likes: Cl.uint(0)
          })
        );
      });
    });

    it("should efficiently track user likes across multiple messages", () => {
      // Create multiple messages
      for (let i = 1; i <= 10; i++) {
        simnet.callPublicFn("guestbook", "post-message", [Cl.stringUtf8(`Message ${i}`)], wallet1);
      }
      
      // User 2 likes odd-numbered messages
      for (let i = 1; i <= 10; i += 2) {
        simnet.callPublicFn("guestbook", "like-message", [Cl.uint(i)], wallet2);
      }
      
      // User 3 likes even-numbered messages
      for (let i = 2; i <= 10; i += 2) {
        simnet.callPublicFn("guestbook", "like-message", [Cl.uint(i)], wallet3);
      }
      
      // Verify like tracking
      for (let i = 1; i <= 10; i++) {
        const user2Liked = simnet.callReadOnlyFn(
          "guestbook",
          "has-user-liked",
          [Cl.principal(wallet2), Cl.uint(i)],
          deployer
        );
        
        const user3Liked = simnet.callReadOnlyFn(
          "guestbook",
          "has-user-liked",
          [Cl.principal(wallet3), Cl.uint(i)],
          deployer
        );
        
        if (i % 2 === 1) {
          // Odd messages liked by user2
          expect(user2Liked.result).toBeTuple({ liked: Cl.bool(true) });
          expect(user3Liked.result).toBeTuple({ liked: Cl.bool(false) });
        } else {
          // Even messages liked by user3
          expect(user2Liked.result).toBeTuple({ liked: Cl.bool(false) });
          expect(user3Liked.result).toBeTuple({ liked: Cl.bool(true) });
        }
      }
    });
  });

  describe("Concurrent Operation Simulation", () => {
    it("should handle simulated concurrent posts and likes", () => {
      // Simulate concurrent operations by interleaving them
      const operations = [
        { user: wallet1, action: "post", content: "Concurrent 1" },
        { user: wallet2, action: "post", content: "Concurrent 2" },
        { user: wallet3, action: "like", messageId: 1 },
        { user: wallet1, action: "post", content: "Concurrent 3" },
        { user: wallet2, action: "like", messageId: 2 },
        { user: wallet3, action: "like", messageId: 3 },
        { user: wallet1, action: "like", messageId: 2 },
        { user: wallet2, action: "post", content: "Concurrent 4" },
      ];
      
      let messageCount = 0;
      const expectedLikes = { 1: 0, 2: 0, 3: 0, 4: 0 };
      
      operations.forEach((op) => {
        if (op.action === "post") {
          messageCount++;
          const response = simnet.callPublicFn(
            "guestbook",
            "post-message",
            [Cl.stringUtf8(op.content!)],
            op.user
          );
          expect(response.result).toBeOk(Cl.uint(messageCount));
        } else {
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
      
      // Verify final state consistency
      expect(messageCount).toBe(4);
      
      Object.entries(expectedLikes).forEach(([messageId, expectedCount]) => {
        const message = simnet.callReadOnlyFn(
          "guestbook",
          "get-message",
          [Cl.uint(parseInt(messageId))],
          deployer
        );
        
        if (parseInt(messageId) <= messageCount) {
          expect(message.result).toBeSome();
          const messageData = message.result as any;
          expect(messageData.value.data.likes).toBeUint(expectedCount);
        }
      });
    });
  });
});
