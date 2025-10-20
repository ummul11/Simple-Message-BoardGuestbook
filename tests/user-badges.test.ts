import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("User Badges Contract Tests", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Contract Initialization", () => {
    it("should initialize with zero badges", () => {
      const lastBadgeId = simnet.callReadOnlyFn(
        "user-badges",
        "get-last-badge-id",
        [],
        deployer
      );
      expect(lastBadgeId.result).toBeUint(0);
    });

    it("should return none for non-existent badge", () => {
      const badge = simnet.callReadOnlyFn(
        "user-badges",
        "get-badge",
        [Cl.uint(1)],
        deployer
      );
      expect(badge.result).toBeNone();
    });

    it("should return zero badges for new user", () => {
      const badgeCount = simnet.callReadOnlyFn(
        "user-badges",
        "get-user-badge-count",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(badgeCount.result).toBeTuple({
        "total-badges": Cl.uint(0)
      });
    });
  });

  describe("Create Badge Functionality", () => {
    it("should allow contract owner to create badge", () => {
      const response = simnet.callPublicFn(
        "user-badges",
        "create-badge",
        [
          Cl.stringUtf8("First Message"),
          Cl.stringUtf8("Posted your first message"),
          Cl.stringUtf8("badge-first"),
          Cl.stringUtf8("Post at least one message")
        ],
        deployer
      );

      expect(response.result).toBeOk(Cl.uint(1));

      // Verify badge was created
      const badge = simnet.callReadOnlyFn(
        "user-badges",
        "get-badge",
        [Cl.uint(1)],
        deployer
      );

      expect(badge.result).toBeSome(
        Cl.tuple({
          name: Cl.stringUtf8("First Message"),
          description: Cl.stringUtf8("Posted your first message"),
          icon: Cl.stringUtf8("badge-first"),
          criteria: Cl.stringUtf8("Post at least one message"),
          "created-at": Cl.uint(simnet.blockHeight - 1)
        })
      );
    });

    it("should increment badge ID for multiple badges", () => {
      // Create first badge
      const response1 = simnet.callPublicFn(
        "user-badges",
        "create-badge",
        [
          Cl.stringUtf8("Badge 1"),
          Cl.stringUtf8("Description 1"),
          Cl.stringUtf8("icon1"),
          Cl.stringUtf8("Criteria 1")
        ],
        deployer
      );
      expect(response1.result).toBeOk(Cl.uint(1));

      // Create second badge
      const response2 = simnet.callPublicFn(
        "user-badges",
        "create-badge",
        [
          Cl.stringUtf8("Badge 2"),
          Cl.stringUtf8("Description 2"),
          Cl.stringUtf8("icon2"),
          Cl.stringUtf8("Criteria 2")
        ],
        deployer
      );
      expect(response2.result).toBeOk(Cl.uint(2));

      // Verify last badge ID
      const lastBadgeId = simnet.callReadOnlyFn(
        "user-badges",
        "get-last-badge-id",
        [],
        deployer
      );
      expect(lastBadgeId.result).toBeUint(2);
    });

    it("should prevent non-owner from creating badge", () => {
      const response = simnet.callPublicFn(
        "user-badges",
        "create-badge",
        [
          Cl.stringUtf8("Badge"),
          Cl.stringUtf8("Description"),
          Cl.stringUtf8("icon"),
          Cl.stringUtf8("Criteria")
        ],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(6)); // ERR_UNAUTHORIZED
    });

    it("should reject empty badge name", () => {
      const response = simnet.callPublicFn(
        "user-badges",
        "create-badge",
        [
          Cl.stringUtf8(""),
          Cl.stringUtf8("Description"),
          Cl.stringUtf8("icon"),
          Cl.stringUtf8("Criteria")
        ],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(2)); // ERR_INVALID_BADGE_NAME
    });

    it("should reject empty description", () => {
      const response = simnet.callPublicFn(
        "user-badges",
        "create-badge",
        [
          Cl.stringUtf8("Badge"),
          Cl.stringUtf8(""),
          Cl.stringUtf8("icon"),
          Cl.stringUtf8("Criteria")
        ],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(3)); // ERR_INVALID_DESCRIPTION
    });

    it("should reject empty icon", () => {
      const response = simnet.callPublicFn(
        "user-badges",
        "create-badge",
        [
          Cl.stringUtf8("Badge"),
          Cl.stringUtf8("Description"),
          Cl.stringUtf8(""),
          Cl.stringUtf8("Criteria")
        ],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(7)); // ERR_INVALID_ICON
    });

    it("should reject empty criteria", () => {
      const response = simnet.callPublicFn(
        "user-badges",
        "create-badge",
        [
          Cl.stringUtf8("Badge"),
          Cl.stringUtf8("Description"),
          Cl.stringUtf8("icon"),
          Cl.stringUtf8("")
        ],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(8)); // ERR_INVALID_CRITERIA
    });
  });

  describe("Award Badge Functionality", () => {
    beforeEach(() => {
      // Create a badge
      simnet.callPublicFn(
        "user-badges",
        "create-badge",
        [
          Cl.stringUtf8("Test Badge"),
          Cl.stringUtf8("Test Description"),
          Cl.stringUtf8("test-icon"),
          Cl.stringUtf8("Test Criteria")
        ],
        deployer
      );
    });

    it("should allow contract owner to award badge", () => {
      const response = simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify badge was awarded
      const hasBadge = simnet.callReadOnlyFn(
        "user-badges",
        "has-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );

      expect(hasBadge.result).not.toBeNone();
    });

    it("should update badge count when awarding badge", () => {
      // Award badge
      simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );

      // Check badge count
      const badgeCount = simnet.callReadOnlyFn(
        "user-badges",
        "get-user-badge-count",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(badgeCount.result).toBeTuple({
        "total-badges": Cl.uint(1)
      });
    });

    it("should prevent awarding same badge twice to same user", () => {
      // First award should succeed
      const response1 = simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
      expect(response1.result).toBeOk(Cl.bool(true));

      // Second award should fail
      const response2 = simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
      expect(response2.result).toBeErr(Cl.uint(5)); // ERR_BADGE_ALREADY_EARNED
    });

    it("should allow multiple users to earn same badge", () => {
      // First user earns badge
      const response1 = simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
      expect(response1.result).toBeOk(Cl.bool(true));

      // Second user earns badge
      const response2 = simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet2), Cl.uint(1)],
        deployer
      );
      expect(response2.result).toBeOk(Cl.bool(true));
    });

    it("should prevent non-owner from awarding badge", () => {
      const response = simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(6)); // ERR_UNAUTHORIZED
    });

    it("should fail when awarding non-existent badge", () => {
      const response = simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet1), Cl.uint(999)],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(1)); // ERR_BADGE_NOT_FOUND
    });
  });

  describe("Revoke Badge Functionality", () => {
    beforeEach(() => {
      // Create a badge
      simnet.callPublicFn(
        "user-badges",
        "create-badge",
        [
          Cl.stringUtf8("Test Badge"),
          Cl.stringUtf8("Test Description"),
          Cl.stringUtf8("test-icon"),
          Cl.stringUtf8("Test Criteria")
        ],
        deployer
      );

      // Award badge to wallet1
      simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
    });

    it("should allow contract owner to revoke badge", () => {
      const response = simnet.callPublicFn(
        "user-badges",
        "revoke-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify badge was revoked
      const hasBadge = simnet.callReadOnlyFn(
        "user-badges",
        "has-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );

      expect(hasBadge.result).toBeNone();
    });

    it("should update badge count when revoking badge", () => {
      // Revoke badge
      simnet.callPublicFn(
        "user-badges",
        "revoke-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );

      // Check badge count
      const badgeCount = simnet.callReadOnlyFn(
        "user-badges",
        "get-user-badge-count",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(badgeCount.result).toBeTuple({
        "total-badges": Cl.uint(0)
      });
    });

    it("should prevent non-owner from revoking badge", () => {
      const response = simnet.callPublicFn(
        "user-badges",
        "revoke-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );
      expect(response.result).toBeErr(Cl.uint(6)); // ERR_UNAUTHORIZED
    });

    it("should fail when revoking non-existent badge", () => {
      const response = simnet.callPublicFn(
        "user-badges",
        "revoke-badge",
        [Cl.principal(wallet1), Cl.uint(999)],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(1)); // ERR_BADGE_NOT_FOUND
    });

    it("should fail when revoking badge user doesn't have", () => {
      const response = simnet.callPublicFn(
        "user-badges",
        "revoke-badge",
        [Cl.principal(wallet2), Cl.uint(1)],
        deployer
      );
      expect(response.result).toBeErr(Cl.uint(1)); // ERR_BADGE_NOT_FOUND
    });
  });

  describe("Multiple Badges", () => {
    beforeEach(() => {
      // Create multiple badges
      simnet.callPublicFn(
        "user-badges",
        "create-badge",
        [
          Cl.stringUtf8("Badge 1"),
          Cl.stringUtf8("Description 1"),
          Cl.stringUtf8("icon1"),
          Cl.stringUtf8("Criteria 1")
        ],
        deployer
      );
      simnet.callPublicFn(
        "user-badges",
        "create-badge",
        [
          Cl.stringUtf8("Badge 2"),
          Cl.stringUtf8("Description 2"),
          Cl.stringUtf8("icon2"),
          Cl.stringUtf8("Criteria 2")
        ],
        deployer
      );
      simnet.callPublicFn(
        "user-badges",
        "create-badge",
        [
          Cl.stringUtf8("Badge 3"),
          Cl.stringUtf8("Description 3"),
          Cl.stringUtf8("icon3"),
          Cl.stringUtf8("Criteria 3")
        ],
        deployer
      );
    });

    it("should allow user to earn multiple badges", () => {
      // Award all badges
      simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
      simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet1), Cl.uint(2)],
        deployer
      );
      simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet1), Cl.uint(3)],
        deployer
      );

      // Check badge count
      const badgeCount = simnet.callReadOnlyFn(
        "user-badges",
        "get-user-badge-count",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(badgeCount.result).toBeTuple({
        "total-badges": Cl.uint(3)
      });
    });

    it("should correctly track individual badges", () => {
      // Award badges
      simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
      simnet.callPublicFn(
        "user-badges",
        "award-badge",
        [Cl.principal(wallet1), Cl.uint(2)],
        deployer
      );

      // Check each badge
      const badge1 = simnet.callReadOnlyFn(
        "user-badges",
        "has-badge",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
      expect(badge1.result).not.toBeNone();

      const badge2 = simnet.callReadOnlyFn(
        "user-badges",
        "has-badge",
        [Cl.principal(wallet1), Cl.uint(2)],
        deployer
      );
      expect(badge2.result).not.toBeNone();

      const badge3 = simnet.callReadOnlyFn(
        "user-badges",
        "has-badge",
        [Cl.principal(wallet1), Cl.uint(3)],
        deployer
      );
      expect(badge3.result).toBeNone();
    });
  });


});

