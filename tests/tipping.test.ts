import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";
import { TippingTestHelpers, TIPPING_ERROR_CODES } from "./test-helpers";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const wallet4 = accounts.get("wallet_4")!;

describe("Tipping Contract Tests", () => {
  let tippingHelpers: TippingTestHelpers;

  beforeEach(() => {
    // Reset the simnet state before each test
    simnet.setEpoch("3.0");
    tippingHelpers = new TippingTestHelpers(accounts);
  });

  describe("Contract Initialization", () => {
    it("should initialize with zero tips", () => {
      const lastTipId = simnet.callReadOnlyFn(
        "tipping",
        "get-last-tip-id",
        [],
        deployer
      );
      expect(lastTipId.result).toBeUint(0);
    });

    it("should return none for non-existent tip", () => {
      const tip = simnet.callReadOnlyFn(
        "tipping",
        "get-tip",
        [Cl.uint(1)],
        deployer
      );
      expect(tip.result).toBeNone();
    });

    it("should return zero tips for new users", () => {
      const tipsReceived = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-received",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(tipsReceived.result).toBeTuple({
        "total-amount": Cl.uint(0)
      });

      const tipsSent = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-sent",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(tipsSent.result).toBeTuple({
        "total-amount": Cl.uint(0)
      });
    });
  });

  describe("Send Tip Functionality", () => {
    it("should successfully send a tip", () => {
      const tipAmount = 1000000; // 1 STX in micro-STX
      const messageId = 1;
      
      const response = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet2), Cl.uint(tipAmount), Cl.uint(messageId)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(1));
      
      // Verify the tip was stored correctly
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
          amount: Cl.uint(tipAmount),
          "message-id": Cl.uint(messageId),
          timestamp: Cl.uint(simnet.blockHeight)
        })
      );
    });

    it("should increment tip ID for multiple tips", () => {
      const tipAmount = 500000; // 0.5 STX
      
      // Send first tip
      const response1 = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet2), Cl.uint(tipAmount), Cl.uint(1)],
        wallet1
      );
      expect(response1.result).toBeOk(Cl.uint(1));

      // Send second tip
      const response2 = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet3), Cl.uint(tipAmount), Cl.uint(2)],
        wallet1
      );
      expect(response2.result).toBeOk(Cl.uint(2));

      // Verify last tip ID
      const lastTipId = simnet.callReadOnlyFn(
        "tipping",
        "get-last-tip-id",
        [],
        deployer
      );
      expect(lastTipId.result).toBeUint(2);
    });

    it("should update user tip statistics correctly", () => {
      const tipAmount = 2000000; // 2 STX
      
      // Send tip
      simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet2), Cl.uint(tipAmount), Cl.uint(1)],
        wallet1
      );

      // Check sender statistics
      const senderStats = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-sent",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(senderStats.result).toBeTuple({
        "total-amount": Cl.uint(tipAmount)
      });

      // Check recipient statistics
      const recipientStats = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-received",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(recipientStats.result).toBeTuple({
        "total-amount": Cl.uint(tipAmount)
      });
    });

    it("should accumulate multiple tips correctly", () => {
      const tip1Amount = 1000000; // 1 STX
      const tip2Amount = 1500000; // 1.5 STX
      const totalAmount = tip1Amount + tip2Amount;
      
      // Send first tip
      simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet2), Cl.uint(tip1Amount), Cl.uint(1)],
        wallet1
      );

      // Send second tip to same recipient
      simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet2), Cl.uint(tip2Amount), Cl.uint(2)],
        wallet1
      );

      // Check accumulated statistics
      const senderStats = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-sent",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(senderStats.result).toBeTuple({
        "total-amount": Cl.uint(totalAmount)
      });

      const recipientStats = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-received",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(recipientStats.result).toBeTuple({
        "total-amount": Cl.uint(totalAmount)
      });
    });
  });

  describe("Error Conditions", () => {
    it("should fail with invalid amount (zero)", () => {
      const response = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet2), Cl.uint(0), Cl.uint(1)],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(TIPPING_ERROR_CODES.INVALID_AMOUNT));
    });

    it("should prevent self-tipping", () => {
      const response = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet1), Cl.uint(1000000), Cl.uint(1)],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(TIPPING_ERROR_CODES.SELF_TIP));
    });

    it("should fail with insufficient balance", () => {
      // Try to send more STX than available
      const excessiveAmount = 200000000000000; // Much more than wallet balance
      
      const response = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet2), Cl.uint(excessiveAmount), Cl.uint(1)],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(TIPPING_ERROR_CODES.INSUFFICIENT_BALANCE));
    });
  });

  describe("STX Transfer Validation", () => {
    it("should actually transfer STX between accounts", () => {
      const tipAmount = 5000000; // 5 STX
      
      // Get initial balances
      const initialSenderBalance = simnet.getAssetsMap().get("STX")?.get(wallet1) || 0;
      const initialRecipientBalance = simnet.getAssetsMap().get("STX")?.get(wallet2) || 0;
      
      // Send tip
      const response = simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet2), Cl.uint(tipAmount), Cl.uint(1)],
        wallet1
      );
      
      expect(response.result).toBeOk(Cl.uint(1));
      
      // Get final balances
      const finalSenderBalance = simnet.getAssetsMap().get("STX")?.get(wallet1) || 0;
      const finalRecipientBalance = simnet.getAssetsMap().get("STX")?.get(wallet2) || 0;
      
      // Verify balance changes
      expect(Number(finalSenderBalance)).toBe(Number(initialSenderBalance) - tipAmount);
      expect(Number(finalRecipientBalance)).toBe(Number(initialRecipientBalance) + tipAmount);
    });
  });

  describe("Read-Only Functions", () => {
    beforeEach(() => {
      // Set up test data
      simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet2), Cl.uint(1000000), Cl.uint(1)],
        wallet1
      );
      simnet.callPublicFn(
        "tipping",
        "send-tip",
        [Cl.principal(wallet3), Cl.uint(2000000), Cl.uint(2)],
        wallet2
      );
    });

    it("should correctly return tip details", () => {
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
          "message-id": Cl.uint(1),
          timestamp: Cl.uint(simnet.blockHeight - 1)
        })
      );
    });

    it("should return correct last tip ID", () => {
      const lastTipId = simnet.callReadOnlyFn(
        "tipping",
        "get-last-tip-id",
        [],
        deployer
      );
      expect(lastTipId.result).toBeUint(2);
    });

    it("should return correct user tip statistics", () => {
      // wallet1 sent 1 STX, received 0
      const wallet1Sent = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-sent",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(wallet1Sent.result).toBeTuple({
        "total-amount": Cl.uint(1000000)
      });

      const wallet1Received = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-received",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(wallet1Received.result).toBeTuple({
        "total-amount": Cl.uint(0)
      });

      // wallet2 sent 2 STX, received 1 STX
      const wallet2Sent = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-sent",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(wallet2Sent.result).toBeTuple({
        "total-amount": Cl.uint(2000000)
      });

      const wallet2Received = simnet.callReadOnlyFn(
        "tipping",
        "get-user-tips-received",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(wallet2Received.result).toBeTuple({
        "total-amount": Cl.uint(1000000)
      });
    });
  });
});
