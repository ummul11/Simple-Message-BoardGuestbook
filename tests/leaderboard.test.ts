import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Leaderboard Contract Tests", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Contract Initialization", () => {
    it("should initialize with zero stats for new user", () => {
      const stats = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-stats",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(stats.result).toBeTuple({
        "messages-posted": Cl.uint(0),
        "total-likes-received": Cl.uint(0),
        "total-tips-sent": Cl.uint(0),
        "total-badges": Cl.uint(0)
      });
    });

    it("should return none for non-existent leaderboard entry", () => {
      const entry = simnet.callReadOnlyFn(
        "leaderboard",
        "get-leaderboard-entry",
        [Cl.uint(1), Cl.stringAscii("messages")],
        deployer
      );

      expect(entry.result).toBeNone();
    });

    it("should return zero rank for user not on leaderboard", () => {
      const rank = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-rank",
        [Cl.principal(wallet1), Cl.stringAscii("messages")],
        deployer
      );

      expect(rank.result).toBeTuple({
        rank: Cl.uint(0)
      });
    });
  });

  describe("Update User Stats Functionality", () => {
    it("should allow contract owner to update message count", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "update-user-stats",
        [Cl.principal(wallet1), Cl.stringAscii("messages"), Cl.uint(5)],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify stats were updated
      const stats = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-stats",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(stats.result).toBeTuple({
        "messages-posted": Cl.uint(5),
        "total-likes-received": Cl.uint(0),
        "total-tips-sent": Cl.uint(0),
        "total-badges": Cl.uint(0)
      });
    });

    it("should allow contract owner to update likes count", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "update-user-stats",
        [Cl.principal(wallet1), Cl.stringAscii("likes"), Cl.uint(10)],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      const stats = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-stats",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(stats.result).toBeTuple({
        "messages-posted": Cl.uint(0),
        "total-likes-received": Cl.uint(10),
        "total-tips-sent": Cl.uint(0),
        "total-badges": Cl.uint(0)
      });
    });

    it("should allow contract owner to update tips count", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "update-user-stats",
        [Cl.principal(wallet1), Cl.stringAscii("tips"), Cl.uint(1000000)],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      const stats = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-stats",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(stats.result).toBeTuple({
        "messages-posted": Cl.uint(0),
        "total-likes-received": Cl.uint(0),
        "total-tips-sent": Cl.uint(1000000),
        "total-badges": Cl.uint(0)
      });
    });

    it("should allow contract owner to update badges count", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "update-user-stats",
        [Cl.principal(wallet1), Cl.stringAscii("badges"), Cl.uint(3)],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      const stats = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-stats",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(stats.result).toBeTuple({
        "messages-posted": Cl.uint(0),
        "total-likes-received": Cl.uint(0),
        "total-tips-sent": Cl.uint(0),
        "total-badges": Cl.uint(3)
      });
    });

    it("should accumulate stats correctly", () => {
      // Add initial stats
      simnet.callPublicFn(
        "leaderboard",
        "update-user-stats",
        [Cl.principal(wallet1), Cl.stringAscii("messages"), Cl.uint(5)],
        deployer
      );

      // Add more stats
      simnet.callPublicFn(
        "leaderboard",
        "update-user-stats",
        [Cl.principal(wallet1), Cl.stringAscii("messages"), Cl.uint(3)],
        deployer
      );

      // Verify accumulated stats
      const stats = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-stats",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(stats.result).toBeTuple({
        "messages-posted": Cl.uint(8),
        "total-likes-received": Cl.uint(0),
        "total-tips-sent": Cl.uint(0),
        "total-badges": Cl.uint(0)
      });
    });

    it("should prevent non-owner from updating stats", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "update-user-stats",
        [Cl.principal(wallet1), Cl.stringAscii("messages"), Cl.uint(5)],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(4)); // ERR_UNAUTHORIZED
    });

    it("should reject invalid dimension", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "update-user-stats",
        [Cl.principal(wallet1), Cl.stringAscii("invalid"), Cl.uint(5)],
        deployer
      );

      expect(response.result).toBeErr(Cl.uint(2)); // ERR_INVALID_DIMENSION
    });
  });

  describe("Leaderboard Entry Management", () => {
    it("should allow contract owner to update leaderboard entry", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "update-leaderboard-entry",
        [
          Cl.stringAscii("messages"),
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.uint(100)
        ],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify entry was created
      const entry = simnet.callReadOnlyFn(
        "leaderboard",
        "get-leaderboard-entry",
        [Cl.uint(1), Cl.stringAscii("messages")],
        deployer
      );

      expect(entry.result).not.toBeNone();
    });

    it("should update user ranking when updating leaderboard entry", () => {
      // Update leaderboard entry
      simnet.callPublicFn(
        "leaderboard",
        "update-leaderboard-entry",
        [
          Cl.stringAscii("messages"),
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.uint(100)
        ],
        deployer
      );

      // Check user rank
      const rank = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-rank",
        [Cl.principal(wallet1), Cl.stringAscii("messages")],
        deployer
      );

      expect(rank.result).toBeTuple({
        rank: Cl.uint(1)
      });
    });

    it("should allow multiple users on leaderboard", () => {
      // Add wallet1 at rank 1
      simnet.callPublicFn(
        "leaderboard",
        "update-leaderboard-entry",
        [
          Cl.stringAscii("messages"),
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.uint(100)
        ],
        deployer
      );

      // Add wallet2 at rank 2
      simnet.callPublicFn(
        "leaderboard",
        "update-leaderboard-entry",
        [
          Cl.stringAscii("messages"),
          Cl.uint(2),
          Cl.principal(wallet2),
          Cl.uint(80)
        ],
        deployer
      );

      // Verify both entries
      const entry1 = simnet.callReadOnlyFn(
        "leaderboard",
        "get-leaderboard-entry",
        [Cl.uint(1), Cl.stringAscii("messages")],
        deployer
      );
      expect(entry1.result).not.toBeNone();

      const entry2 = simnet.callReadOnlyFn(
        "leaderboard",
        "get-leaderboard-entry",
        [Cl.uint(2), Cl.stringAscii("messages")],
        deployer
      );
      expect(entry2.result).not.toBeNone();
    });

    it("should prevent non-owner from updating leaderboard entry", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "update-leaderboard-entry",
        [
          Cl.stringAscii("messages"),
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.uint(100)
        ],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(4)); // ERR_UNAUTHORIZED
    });

    it("should reject invalid rank (0)", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "update-leaderboard-entry",
        [
          Cl.stringAscii("messages"),
          Cl.uint(0),
          Cl.principal(wallet1),
          Cl.uint(100)
        ],
        deployer
      );

      expect(response.result).toBeErr(Cl.uint(3)); // ERR_INVALID_AMOUNT
    });

    it("should reject rank exceeding max leaderboard size", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "update-leaderboard-entry",
        [
          Cl.stringAscii("messages"),
          Cl.uint(101),
          Cl.principal(wallet1),
          Cl.uint(100)
        ],
        deployer
      );

      expect(response.result).toBeErr(Cl.uint(3)); // ERR_INVALID_AMOUNT
    });
  });

  describe("Convenience Functions", () => {
    it("should increment message count", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "increment-message-count",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      const stats = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-stats",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(stats.result).toBeTuple({
        "messages-posted": Cl.uint(1),
        "total-likes-received": Cl.uint(0),
        "total-tips-sent": Cl.uint(0),
        "total-badges": Cl.uint(0)
      });
    });

    it("should increment likes received", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "increment-likes-received",
        [Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      const stats = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-stats",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(stats.result).toBeTuple({
        "messages-posted": Cl.uint(0),
        "total-likes-received": Cl.uint(5),
        "total-tips-sent": Cl.uint(0),
        "total-badges": Cl.uint(0)
      });
    });

    it("should increment tips sent", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "increment-tips-sent",
        [Cl.principal(wallet1), Cl.uint(1000000)],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      const stats = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-stats",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(stats.result).toBeTuple({
        "messages-posted": Cl.uint(0),
        "total-likes-received": Cl.uint(0),
        "total-tips-sent": Cl.uint(1000000),
        "total-badges": Cl.uint(0)
      });
    });

    it("should increment badge count", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "increment-badge-count",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      const stats = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-stats",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(stats.result).toBeTuple({
        "messages-posted": Cl.uint(0),
        "total-likes-received": Cl.uint(0),
        "total-tips-sent": Cl.uint(0),
        "total-badges": Cl.uint(1)
      });
    });
  });

  describe("Clear User Ranking", () => {
    beforeEach(() => {
      // Add user to leaderboard
      simnet.callPublicFn(
        "leaderboard",
        "update-leaderboard-entry",
        [
          Cl.stringAscii("messages"),
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.uint(100)
        ],
        deployer
      );
    });

    it("should allow contract owner to clear user ranking", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "clear-user-ranking",
        [Cl.principal(wallet1), Cl.stringAscii("messages")],
        deployer
      );

      expect(response.result).toBeOk(Cl.bool(true));

      // Verify ranking was cleared
      const rank = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-rank",
        [Cl.principal(wallet1), Cl.stringAscii("messages")],
        deployer
      );

      expect(rank.result).toBeTuple({
        rank: Cl.uint(0)
      });
    });

    it("should prevent non-owner from clearing ranking", () => {
      const response = simnet.callPublicFn(
        "leaderboard",
        "clear-user-ranking",
        [Cl.principal(wallet1), Cl.stringAscii("messages")],
        wallet1
      );

      expect(response.result).toBeErr(Cl.uint(4)); // ERR_UNAUTHORIZED
    });
  });

  describe("Multiple Dimensions", () => {
    it("should track different dimensions independently", () => {
      // Add to messages leaderboard
      simnet.callPublicFn(
        "leaderboard",
        "update-leaderboard-entry",
        [
          Cl.stringAscii("messages"),
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.uint(100)
        ],
        deployer
      );

      // Add to likes leaderboard
      simnet.callPublicFn(
        "leaderboard",
        "update-leaderboard-entry",
        [
          Cl.stringAscii("likes"),
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(50)
        ],
        deployer
      );

      // Verify entries are independent
      const messagesEntry = simnet.callReadOnlyFn(
        "leaderboard",
        "get-leaderboard-entry",
        [Cl.uint(1), Cl.stringAscii("messages")],
        deployer
      );
      expect(messagesEntry.result).toBeSome(
        Cl.tuple({
          user: Cl.principal(wallet1),
          score: Cl.uint(100)
        })
      );

      const likesEntry = simnet.callReadOnlyFn(
        "leaderboard",
        "get-leaderboard-entry",
        [Cl.uint(1), Cl.stringAscii("likes")],
        deployer
      );
      expect(likesEntry.result).toBeSome(
        Cl.tuple({
          user: Cl.principal(wallet2),
          score: Cl.uint(50)
        })
      );
    });

    it("should allow same user at different ranks in different dimensions", () => {
      // Add wallet1 at rank 1 in messages
      simnet.callPublicFn(
        "leaderboard",
        "update-leaderboard-entry",
        [
          Cl.stringAscii("messages"),
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.uint(100)
        ],
        deployer
      );

      // Add wallet1 at rank 3 in likes
      simnet.callPublicFn(
        "leaderboard",
        "update-leaderboard-entry",
        [
          Cl.stringAscii("likes"),
          Cl.uint(3),
          Cl.principal(wallet1),
          Cl.uint(50)
        ],
        deployer
      );

      // Verify ranks
      const messagesRank = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-rank",
        [Cl.principal(wallet1), Cl.stringAscii("messages")],
        deployer
      );
      expect(messagesRank.result).toBeTuple({
        rank: Cl.uint(1)
      });

      const likesRank = simnet.callReadOnlyFn(
        "leaderboard",
        "get-user-rank",
        [Cl.principal(wallet1), Cl.stringAscii("likes")],
        deployer
      );
      expect(likesRank.result).toBeTuple({
        rank: Cl.uint(3)
      });
    });
  });

  describe("Last Update Block", () => {
    it("should track last update block height", () => {
      // Update leaderboard
      simnet.callPublicFn(
        "leaderboard",
        "update-leaderboard-entry",
        [
          Cl.stringAscii("messages"),
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.uint(100)
        ],
        deployer
      );

      // Get last update block
      const lastUpdate = simnet.callReadOnlyFn(
        "leaderboard",
        "get-last-update-block",
        [],
        deployer
      );

      expect(lastUpdate.result).toBeUint(simnet.blockHeight - 1);
    });
  });
});

