import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";
import { GuestbookTestHelpers, TippingTestHelpers, TIPPING_ERROR_CODES } from "./test-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const wallet4 = accounts.get("wallet_4")!;

describe("Tipping-Guestbook Integration Tests", () => {
  let guestbookHelpers: GuestbookTestHelpers;
  let tippingHelpers: TippingTestHelpers;

  beforeEach(() => {
    // Reset the simnet state before each test
    simnet.setEpoch("3.0");
    guestbookHelpers = new GuestbookTestHelpers(accounts);
    tippingHelpers = new TippingTestHelpers(accounts);
  });

  describe("Cross-Contract Functionality", () => {
    it("should allow tipping message authors", () => {
      // Post a message first
      const messageContent = "This is a great message worth tipping!";
      const response = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8(messageContent)],
        wallet1
      );
      expect(response.result).toBeOk(Cl.uint(1));

      // Verify message was created
      const message = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(1)],
        deployer
      );
      expect(message.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8(messageContent),
          timestamp: Cl.uint(simnet.blockHeight),
          likes: Cl.uint(0)
        })
      );

      // Now tip the message author
      const tipAmount = 2000000; // 2 STX
      const tipResponse = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet1), Cl.uint(tipAmount), Cl.uint(1)],
        wallet2
      );
      expect(tipResponse.result).toBeOk(Cl.bool(true));

      // Verify tip was recorded
      const tip = simnet.callReadOnlyFn(
        "tipping",
        "get-tip",
        [Cl.uint(1)],
        deployer
      );
      expect(tip.result).toBeSome(
        Cl.tuple({
          sender: Cl.principal(wallet2),
          recipient: Cl.principal(wallet1),
          amount: Cl.uint(tipAmount),
          "message-id": Cl.uint(1),
          timestamp: Cl.uint(2)
        })
      );
    });

    it("should handle multiple tips for the same message", () => {
      // Post a message
      simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("Popular message")],
        wallet1
      );

      // Multiple users tip the same message
      const tip1Amount = 1000000; // 1 STX
      const tip2Amount = 1500000; // 1.5 STX
      const tip3Amount = 500000;  // 0.5 STX

      // First tip
      const tip1Response = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet1), Cl.uint(tip1Amount), Cl.uint(1)],
        wallet2
      );
      expect(tip1Response.result).toBeOk(Cl.bool(true));

      // Second tip
      const tip2Response = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet1), Cl.uint(tip2Amount), Cl.uint(1)],
        wallet3
      );
      expect(tip2Response.result).toBeOk(Cl.bool(true));

      // Third tip
      const tip3Response = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet1), Cl.uint(tip3Amount), Cl.uint(1)],
        wallet4
      );
      expect(tip3Response.result).toBeOk(Cl.bool(true));

      // Verify author received all tips
      const authorStats = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-received",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(authorStats.result).toBeTuple({
        "total-amount": Cl.uint(tip1Amount + tip2Amount + tip3Amount)
      });

      // Verify tip count
      const lastTipId = simnet.callReadOnlyFn(
        "tipping",
        "get-last-tip-id",
        [],
        deployer
      );
      expect(lastTipId.result).toBeUint(3);
    });

    it("should handle tips and likes for the same message", () => {
      // Post a message
      simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("Message with both tips and likes")],
        wallet1
      );

      // Like the message
      const likeResponse = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(1)],
        wallet2
      );
      expect(likeResponse.result).toBeOk(Cl.bool(true));

      // Tip the message author
      const tipResponse = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet1), Cl.uint(1000000), Cl.uint(1)],
        wallet3
      );
      expect(tipResponse.result).toBeOk(Cl.bool(true));

      // Verify message has likes
      const message = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(1)],
        deployer
      );
      expect(message.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8("Message with both tips and likes"),
          timestamp: Cl.uint(simnet.blockHeight - 2),
          likes: Cl.uint(1)
        })
      );

      // Verify tip was recorded
      const tip = simnet.callReadOnlyFn(
        "tipping",
        "get-tip",
        [Cl.uint(1)],
        deployer
      );
      expect(tip.result).toBeSome(
        Cl.tuple({
          sender: Cl.principal(wallet3),
          recipient: Cl.principal(wallet1),
          amount: Cl.uint(1000000),
          "message-id": Cl.uint(1),
          timestamp: Cl.uint(2)
        })
      );
    });

    it("should allow tipping for any message ID (no validation)", () => {
      // Note: The current tipping contract doesn't validate if message-id exists
      // This test documents this behavior
      
      const tipResponse = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet2), Cl.uint(1000000), Cl.uint(999)], // Non-existent message ID
        wallet1
      );
      
      // This succeeds because the contract doesn't validate message existence
      expect(tipResponse.result).toBeOk(Cl.bool(true));

      // Verify tip was recorded with non-existent message ID
      const tip = simnet.callReadOnlyFn(
        "tipping",
        "get-tip",
        [Cl.uint(1)],
        deployer
      );
      expect(tip.result).toBeSome(
        Cl.tuple({
          sender: Cl.principal(wallet1),
          recipient: Cl.principal(wallet2),
          amount: Cl.uint(1000000),
          "message-id": Cl.uint(999),
          timestamp: Cl.uint(simnet.blockHeight - 1)
        })
      );
    });
  });

  describe("Complex Integration Scenarios", () => {
    it("should handle a complete user interaction flow", () => {
      // User 1 posts a message
      const messageResponse = simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("Check out my awesome project!")],
        wallet1
      );
      expect(messageResponse.result).toBeOk(Cl.uint(1));

      // User 2 likes the message
      const likeResponse = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(1)],
        wallet2
      );
      expect(likeResponse.result).toBeOk(Cl.bool(true));

      // User 3 tips the author
      const tipResponse = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet1), Cl.uint(5000000), Cl.uint(1)],
        wallet3
      );
      expect(tipResponse.result).toBeOk(Cl.bool(true));

      // User 4 also likes the message
      const like2Response = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(1)],
        wallet4
      );
      expect(like2Response.result).toBeOk(Cl.bool(true));

      // User 4 also tips the author
      const tip2Response = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet1), Cl.uint(3000000), Cl.uint(1)],
        wallet4
      );
      expect(tip2Response.result).toBeOk(Cl.bool(true));

      // Verify final state
      const finalMessage = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(1)],
        deployer
      );
      expect(finalMessage.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8("Check out my awesome project!"),
          timestamp: Cl.uint(simnet.blockHeight - 4),
          likes: Cl.uint(2)
        })
      );

      // Verify author received both tips
      const authorTips = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-received",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(authorTips.result).toBeTuple({
        "total-amount": Cl.uint(8000000) // 5 STX + 3 STX
      });

      // Verify tip count
      const lastTipId = simnet.callReadOnlyFn(
        "tipping",
        "get-last-tip-id",
        [],
        deployer
      );
      expect(lastTipId.result).toBeUint(2);
    });

    it("should handle multiple messages with cross-tipping", () => {
      // Create multiple messages from different users
      simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("Message from wallet1")],
        wallet1
      );

      simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("Message from wallet2")],
        wallet2
      );

      simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("Message from wallet3")],
        wallet3
      );

      // Cross-tip scenario: everyone tips everyone else
      // wallet1 tips wallet2 and wallet3
      simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet2), Cl.uint(1000000), Cl.uint(2)],
        wallet1
      );
      simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet3), Cl.uint(1500000), Cl.uint(3)],
        wallet1
      );

      // wallet2 tips wallet1 and wallet3
      simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet1), Cl.uint(2000000), Cl.uint(1)],
        wallet2
      );
      simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet3), Cl.uint(500000), Cl.uint(3)],
        wallet2
      );

      // wallet3 tips wallet1 and wallet2
      simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet1), Cl.uint(1200000), Cl.uint(1)],
        wallet3
      );
      simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet2), Cl.uint(800000), Cl.uint(2)],
        wallet3
      );

      // Verify final tip statistics
      const wallet1Stats = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-received",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(wallet1Stats.result).toBeTuple({
        "total-amount": Cl.uint(3200000) // 2M + 1.2M
      });

      const wallet2Stats = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-received",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(wallet2Stats.result).toBeTuple({
        "total-amount": Cl.uint(1800000) // 1M + 0.8M
      });

      const wallet3Stats = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-received",
        [Cl.principal(wallet3)],
        deployer
      );
      expect(wallet3Stats.result).toBeTuple({
        "total-amount": Cl.uint(2000000) // 1.5M + 0.5M
      });

      // Verify total tips sent
      const wallet1Sent = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-sent",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(wallet1Sent.result).toBeTuple({
        "total-amount": Cl.uint(2500000) // 1M + 1.5M
      });
    });
  });

  describe("Error Handling in Integration", () => {
    it("should handle errors gracefully when contracts interact", () => {
      // Post a message
      simnet.callPublicFn(
        "guestbook",
        "post-message",
        [Cl.stringUtf8("Test message")],
        wallet1
      );

      // Try to tip with invalid amount
      const invalidTipResponse = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet1), Cl.uint(0), Cl.uint(1)],
        wallet2
      );
      expect(invalidTipResponse.result).toBeErr(Cl.uint(TIPPING_ERROR_CODES.INVALID_AMOUNT));

      // Try to like the message (should still work)
      const likeResponse = simnet.callPublicFn(
        "guestbook",
        "like-message",
        [Cl.uint(1)],
        wallet2
      );
      expect(likeResponse.result).toBeOk(Cl.bool(true));

      // Try valid tip after failed tip
      const validTipResponse = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet1), Cl.uint(1000000), Cl.uint(1)],
        wallet2
      );
      expect(validTipResponse.result).toBeOk(Cl.bool(true));

      // Verify message state is correct
      const message = simnet.callReadOnlyFn(
        "guestbook",
        "get-message",
        [Cl.uint(1)],
        deployer
      );
      expect(message.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(wallet1),
          content: Cl.stringUtf8("Test message"),
          timestamp: Cl.uint(simnet.blockHeight - 3),
          likes: Cl.uint(1)
        })
      );
    });
  });
});
