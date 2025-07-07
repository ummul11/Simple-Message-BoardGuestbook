import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

/*
  The test below is an example. To learn more, read the testing documentation here:
  https://docs.hiro.so/stacks/clarinet-js-sdk
*/

describe("Guestbook Contract Tests", () => {
  beforeEach(() => {
    // Reset the simnet state before each test
    simnet.setEpoch("3.0");
  });

  describe("Contract Initialization", () => {
    it("should initialize with zero messages", () => {
      const lastMessageId = simnet.callReadOnlyFn(
        "guestbook",
        "get-last-message-id",
        [],
        deployer
      );
      expect(lastMessageId.result).toBeUint(0);
    });

    it("should return none for non-existent message", () => {
      const message = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(1)],
        deployer
      );
      expect(message.result).toBeNone();
    });
  });

  describe("Post Message Functionality", () => {
    it("should successfully post a message", () => {
      const content = "Hello, blockchain world!";
      const response = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8(content)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(1));
      
      // Verify the message was stored correctly
      const message = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(1)],
        deployer
      );
      
      expect(message.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8(content),
          timestamp: Cl.uint(simnet.blockHeight),
          likes: Cl.uint(0)
        })
      );
    });

    it("should increment message ID for multiple messages", () => {
      // Post first message
      const response1 = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("First message")],
        wallet1
      );
      expect(response1.result).toBeOk(Cl.uint(1));

      // Post second message
      const response2 = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("Second message")],
        wallet2
      );
      expect(response2.result).toBeOk(Cl.uint(2));

      // Verify last message ID
      const lastMessageId = simnet.callReadOnlyFn(
        "guestbook",
        "get-last-message-id",
        [],
        deployer
      );
      expect(lastMessageId.result).toBeUint(2);
    });

    it("should handle maximum length messages (280 characters)", () => {
      const maxContent = "a".repeat(280);
      const response = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8(maxContent)],
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
          content: Cl.stringUtf8(maxContent),
          timestamp: Cl.uint(simnet.blockHeight),
          likes: Cl.uint(0)
        })
      );
    });

    it("should handle empty messages", () => {
      const response = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("")],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(1));
    });

    it("should handle unicode characters", () => {
      const unicodeContent = "Hello 🌍! 你好世界 🚀";
      const response = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8(unicodeContent)],
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
          content: Cl.stringUtf8(unicodeContent),
          timestamp: Cl.uint(simnet.blockHeight),
          likes: Cl.uint(0)
        })
      );
    });
  });

  describe("Like Message Functionality", () => {
    beforeEach(() => {
      // Post a test message before each like test
      simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("Test message for liking")],
        wallet1
      );
    });

    it("should successfully like a message", () => {
      const response = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(1)],
        wallet2
      );

      expect(response.result).toBeOk(Cl.bool(true));
      
      // Verify the like count increased
      const message = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(1)],
        deployer
      );
      
      expect(message.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8("Test message for liking"),
          timestamp: Cl.uint(simnet.blockHeight - 1),
          likes: Cl.uint(1)
        })
      );
    });

    it("should track user likes correctly", () => {
      // Like the message
      simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(1)],
        wallet2
      );

      // Check if user has liked the message
      const hasLiked = simnet.callReadOnlyFn(
        "guestbook",
        "has-user-liked",
        [Cl.principal(wallet2), Cl.uint(1)],
        deployer
      );
      
      expect(hasLiked.result).toBeTuple({
        liked: Cl.bool(true)
      });
    });

    it("should prevent duplicate likes from same user", () => {
      // First like should succeed
      const response1 = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(1)],
        wallet2
      );
      expect(response1.result).toBeOk(Cl.bool(true));

      // Second like from same user should fail
      const response2 = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(1)],
        wallet2
      );
      expect(response2.result).toBeErr(Cl.uint(2)); // Error code for already liked
    });

    it("should allow multiple users to like the same message", () => {
      // Multiple users like the same message
      const response1 = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(1)],
        wallet2
      );
      expect(response1.result).toBeOk(Cl.bool(true));

      const response2 = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(1)],
        wallet3
      );
      expect(response2.result).toBeOk(Cl.bool(true));

      // Verify like count is 2
      const message = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(1)],
        deployer
      );
      
      expect(message.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8("Test message for liking"),
          timestamp: Cl.uint(simnet.blockHeight - 2),
          likes: Cl.uint(2)
        })
      );
    });

    it("should fail when trying to like non-existent message", () => {
      const response = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(999)],
        wallet2
      );

      expect(response.result).toBeErr(Cl.uint(1)); // Error code for message not found
    });

    it("should allow author to like their own message", () => {
      const response = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(1)],
        wallet1 // Same user who posted the message
      );

      expect(response.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Read-Only Functions", () => {
    beforeEach(() => {
      // Set up test data
      simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("First message")],
        wallet1
      );
      simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("Second message")],
        wallet2
      );
      simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(1)],
        wallet2
      );
    });

    it("should correctly return message details", () => {
      const message = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(1)],
        deployer
      );
      
      expect(message.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8("First message"),
          timestamp: Cl.uint(simnet.blockHeight - 2),
          likes: Cl.uint(1)
        })
      );
    });

    it("should return correct last message ID", () => {
      const lastMessageId = simnet.callReadOnlyFn(
        "guestbook",
        "get-last-message-id",
        [],
        deployer
      );
      expect(lastMessageId.result).toBeUint(2);
    });

    it("should correctly check if user has liked a message", () => {
      // User who liked
      const hasLiked = simnet.callReadOnlyFn(
        "guestbook",
        "has-user-liked",
        [Cl.principal(wallet2), Cl.uint(1)],
        deployer
      );
      expect(hasLiked.result).toBeTuple({
        liked: Cl.bool(true)
      });

      // User who hasn't liked
      const hasNotLiked = simnet.callReadOnlyFn(
        "guestbook",
        "has-user-liked",
        [Cl.principal(wallet3), Cl.uint(1)],
        deployer
      );
      expect(hasNotLiked.result).toBeTuple({
        liked: Cl.bool(false)
      });
    });

    it("should return false for non-existent user-message combination", () => {
      const hasLiked = simnet.callReadOnlyFn(
        "guestbook",
        "has-user-liked",
        [Cl.principal(wallet1), Cl.uint(999)],
        deployer
      );
      expect(hasLiked.result).toBeTuple({
        liked: Cl.bool(false)
      });
    });
  });
});
