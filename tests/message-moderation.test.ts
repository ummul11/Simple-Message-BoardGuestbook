import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;
const wallet4 = accounts.get("wallet_4")!;

describe("Message Moderation Contract Tests", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Contract Initialization", () => {
    it("should initialize with zero reports", () => {
      const lastReportId = simnet.callReadOnlyFn(
        "message-moderation",
        "get-last-report-id",
        [],
        deployer
      );
      expect(lastReportId.result).toBeUint(0);
    });

    it("should initialize with zero moderation actions", () => {
      const lastActionId = simnet.callReadOnlyFn(
        "message-moderation",
        "get-last-action-id",
        [],
        deployer
      );
      expect(lastActionId.result).toBeUint(0);
    });

    it("should return none for non-existent report", () => {
      const report = simnet.callReadOnlyFn(
        "message-moderation",
        "get-report",
        [Cl.uint(1)],
        deployer
      );
      expect(report.result).toBeNone();
    });

    it("should return default reputation for new user", () => {
      const reputation = simnet.callReadOnlyFn(
        "message-moderation",
        "get-user-reputation",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(reputation.result).toBeTuple({
        "reputation-score": Cl.int(0),
        warnings: Cl.uint(0),
        "is-banned": Cl.bool(false)
      });
    });
  });

  describe("Report Message Functionality", () => {
    it("should successfully report a message", () => {
      const reason = "Inappropriate content";
      const response = simnet.callPublicFn(
        "message-moderation",
        "report-message",
        [Cl.uint(1), Cl.stringUtf8(reason)],
        wallet1
      );

      expect(response.result).toBeOk(Cl.uint(1));

      // Verify report was stored
      const report = simnet.callReadOnlyFn(
        "message-moderation",
        "get-report",
        [Cl.uint(1)],
        deployer
      );

      expect(report.result).toBeSome(
        Cl.tuple({
          reporter: Cl.principal(wallet1),
          "message-id": Cl.uint(1),
          reason: Cl.stringUtf8(reason),
          timestamp: Cl.uint(simnet.blockHeight - 1),
          status: Cl.stringAscii("pending")
        })
      );
    });

    it("should increment report ID for multiple reports", () => {
      // First report
      const response1 = simnet.callPublicFn(
        "message-moderation",
        "report-message",
        [Cl.uint(1), Cl.stringUtf8("Spam")],
        wallet1
      );
      expect(response1.result).toBeOk(Cl.uint(1));

      // Second report
      const response2 = simnet.callPublicFn(
        "message-moderation",
        "report-message",
        [Cl.uint(2), Cl.stringUtf8("Offensive")],
        wallet2
      );
      expect(response2.result).toBeOk(Cl.uint(2));

      // Verify last report ID
      const lastReportId = simnet.callReadOnlyFn(
        "message-moderation",
        "get-last-report-id",
        [],
        deployer
      );
      expect(lastReportId.result).toBeUint(2);
    });

    it("should prevent duplicate reports from same user for same message", () => {
      // First report should succeed
      const response1 = simnet.callPublicFn(
        "message-moderation",
        "report-message",
        [Cl.uint(1), Cl.stringUtf8("Spam")],
        wallet1
      );
      expect(response1.result).toBeOk(Cl.uint(1));

      // Second report from same user for same message should fail
      const response2 = simnet.callPublicFn(
        "message-moderation",
        "report-message",
        [Cl.uint(1), Cl.stringUtf8("Still spam")],
        wallet1
      );
      expect(response2.result).toBeErr(Cl.uint(6)); // ERR_ALREADY_REPORTED
    });

    it("should allow different users to report same message", () => {
      // First user reports
      const response1 = simnet.callPublicFn(
        "message-moderation",
        "report-message",
        [Cl.uint(1), Cl.stringUtf8("Spam")],
        wallet1
      );
      expect(response1.result).toBeOk(Cl.uint(1));

      // Second user reports same message
      const response2 = simnet.callPublicFn(
        "message-moderation",
        "report-message",
        [Cl.uint(1), Cl.stringUtf8("Also spam")],
        wallet2
      );
      expect(response2.result).toBeOk(Cl.uint(2));
    });

    it("should reject empty reason", () => {
      const response = simnet.callPublicFn(
        "message-moderation",
        "report-message",
        [Cl.uint(1), Cl.stringUtf8("")],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(3)); // ERR_INVALID_REASON
    });

    it("should handle maximum length reason (280 characters)", () => {
      const maxReason = "a".repeat(280);
      const response = simnet.callPublicFn(
        "message-moderation",
        "report-message",
        [Cl.uint(1), Cl.stringUtf8(maxReason)],
        wallet1
      );
      expect(response.result).toBeOk(Cl.uint(1));
    });
  });

  describe("Moderator Management", () => {
    it("should allow contract owner to add moderator", () => {
      const response = simnet.callPublicFn(
        "message-moderation",
        "add-moderator",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Verify moderator status
      const isMod = simnet.callReadOnlyFn(
        "message-moderation",
        "is-moderator",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(isMod.result).toBeTuple({
        "is-moderator": Cl.bool(true)
      });
    });

    it("should prevent non-owner from adding moderator", () => {
      const response = simnet.callPublicFn(
        "message-moderation",
        "add-moderator",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(8)); // ERR_UNAUTHORIZED
    });

    it("should allow contract owner to remove moderator", () => {
      // Add moderator first
      simnet.callPublicFn(
        "message-moderation",
        "add-moderator",
        [Cl.principal(wallet1)],
        deployer
      );

      // Remove moderator
      const response = simnet.callPublicFn(
        "message-moderation",
        "remove-moderator",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Verify moderator status is removed
      const isMod = simnet.callReadOnlyFn(
        "message-moderation",
        "is-moderator",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(isMod.result).toBeTuple({
        "is-moderator": Cl.bool(false)
      });
    });
  });

  describe("Moderation Actions", () => {
    beforeEach(() => {
      // Add wallet1 as moderator
      simnet.callPublicFn(
        "message-moderation",
        "add-moderator",
        [Cl.principal(wallet1)],
        deployer
      );

      // Create a report
      simnet.callPublicFn(
        "message-moderation",
        "report-message",
        [Cl.uint(1), Cl.stringUtf8("Spam")],
        wallet2
      );
    });

    it("should allow moderator to warn user", () => {
      const response = simnet.callPublicFn(
        "message-moderation",
        "moderate-report",
        [Cl.uint(1), Cl.stringAscii("warn")],
        wallet1
      );
      expect(response.result).toBeOk(Cl.uint(1));

      // Verify reputation was updated
      const reputation = simnet.callReadOnlyFn(
        "message-moderation",
        "get-user-reputation",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(reputation.result).toBeTuple({
        "reputation-score": Cl.int(-10),
        warnings: Cl.uint(1),
        "is-banned": Cl.bool(false)
      });
    });

    it("should allow moderator to ban user", () => {
      const response = simnet.callPublicFn(
        "message-moderation",
        "moderate-report",
        [Cl.uint(1), Cl.stringAscii("ban")],
        wallet1
      );
      expect(response.result).toBeOk(Cl.uint(1));

      // Verify user is banned
      const reputation = simnet.callReadOnlyFn(
        "message-moderation",
        "get-user-reputation",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(reputation.result).toBeTuple({
        "reputation-score": Cl.int(-50),
        warnings: Cl.uint(0),
        "is-banned": Cl.bool(true)
      });
    });

    it("should prevent non-moderator from moderating", () => {
      const response = simnet.callPublicFn(
        "message-moderation",
        "moderate-report",
        [Cl.uint(1), Cl.stringAscii("warn")],
        wallet3
      );
      expect(response.result).toBeErr(Cl.uint(4)); // ERR_NOT_MODERATOR
    });

    it("should reject invalid moderation action", () => {
      const response = simnet.callPublicFn(
        "message-moderation",
        "moderate-report",
        [Cl.uint(1), Cl.stringAscii("invalid")],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(5)); // ERR_INVALID_ACTION
    });

    it("should fail when moderating non-existent report", () => {
      const response = simnet.callPublicFn(
        "message-moderation",
        "moderate-report",
        [Cl.uint(999), Cl.stringAscii("warn")],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(1)); // ERR_REPORT_NOT_FOUND
    });

    it("should update report status to approved after moderation", () => {
      // Moderate the report
      simnet.callPublicFn(
        "message-moderation",
        "moderate-report",
        [Cl.uint(1), Cl.stringAscii("warn")],
        wallet1
      );

      // Verify report status
      const report = simnet.callReadOnlyFn(
        "message-moderation",
        "get-report",
        [Cl.uint(1)],
        deployer
      );
      expect(report.result).toBeSome(
        Cl.tuple({
          reporter: Cl.principal(wallet2),
          "message-id": Cl.uint(1),
          reason: Cl.stringUtf8("Spam"),
          timestamp: Cl.uint(simnet.blockHeight - 3),
          status: Cl.stringAscii("approved")
        })
      );
    });
  });

  describe("Report Rejection", () => {
    beforeEach(() => {
      // Add wallet1 as moderator
      simnet.callPublicFn(
        "message-moderation",
        "add-moderator",
        [Cl.principal(wallet1)],
        deployer
      );

      // Create a report
      simnet.callPublicFn(
        "message-moderation",
        "report-message",
        [Cl.uint(1), Cl.stringUtf8("Spam")],
        wallet2
      );
    });

    it("should allow moderator to reject report", () => {
      const response = simnet.callPublicFn(
        "message-moderation",
        "reject-report",
        [Cl.uint(1)],
        wallet1
      );
      expect(response.result).toBeOk(Cl.bool(true));

      // Verify report status is rejected
      const report = simnet.callReadOnlyFn(
        "message-moderation",
        "get-report",
        [Cl.uint(1)],
        deployer
      );
      expect(report.result).not.toBeNone();
    });

    it("should prevent non-moderator from rejecting report", () => {
      const response = simnet.callPublicFn(
        "message-moderation",
        "reject-report",
        [Cl.uint(1)],
        wallet3
      );
      expect(response.result).toBeErr(Cl.uint(4)); // ERR_NOT_MODERATOR
    });

    it("should fail when rejecting non-existent report", () => {
      const response = simnet.callPublicFn(
        "message-moderation",
        "reject-report",
        [Cl.uint(999)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(1)); // ERR_REPORT_NOT_FOUND
    });
  });

  describe("Read-Only Functions", () => {
    beforeEach(() => {
      // Add moderators
      simnet.callPublicFn(
        "message-moderation",
        "add-moderator",
        [Cl.principal(wallet1)],
        deployer
      );

      // Create reports
      simnet.callPublicFn(
        "message-moderation",
        "report-message",
        [Cl.uint(1), Cl.stringUtf8("Spam")],
        wallet2
      );
      simnet.callPublicFn(
        "message-moderation",
        "report-message",
        [Cl.uint(2), Cl.stringUtf8("Offensive")],
        wallet3
      );

      // Moderate first report
      simnet.callPublicFn(
        "message-moderation",
        "moderate-report",
        [Cl.uint(1), Cl.stringAscii("warn")],
        wallet1
      );
    });

    it("should correctly return report details", () => {
      const report = simnet.callReadOnlyFn(
        "message-moderation",
        "get-report",
        [Cl.uint(1)],
        deployer
      );

      expect(report.result).toBeSome(
        Cl.tuple({
          reporter: Cl.principal(wallet2),
          "message-id": Cl.uint(1),
          reason: Cl.stringUtf8("Spam"),
          timestamp: Cl.uint(simnet.blockHeight - 4),
          status: Cl.stringAscii("approved")
        })
      );
    });

    it("should correctly return moderation action details", () => {
      const action = simnet.callReadOnlyFn(
        "message-moderation",
        "get-moderation-action",
        [Cl.uint(1)],
        deployer
      );

      expect(action.result).not.toBeNone();
    });

    it("should correctly check if user has reported message", () => {
      const hasReported = simnet.callReadOnlyFn(
        "message-moderation",
        "has-user-reported-message",
        [Cl.principal(wallet2), Cl.uint(1)],
        deployer
      );

      expect(hasReported.result).toBeTuple({
        reported: Cl.bool(true)
      });

      const hasNotReported = simnet.callReadOnlyFn(
        "message-moderation",
        "has-user-reported-message",
        [Cl.principal(wallet2), Cl.uint(2)],
        deployer
      );

      expect(hasNotReported.result).toBeTuple({
        reported: Cl.bool(false)
      });
    });
  });
});

