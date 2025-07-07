import { describe, it, expect } from "vitest";

describe("Test Setup Verification", () => {
  it("should have access to simnet", () => {
    expect(simnet).toBeDefined();
    expect(typeof simnet.getAccounts).toBe("function");
  });

  it("should have test accounts available", () => {
    const accounts = simnet.getAccounts();
    expect(accounts.size).toBeGreaterThan(0);
    expect(accounts.has("deployer")).toBe(true);
    expect(accounts.has("wallet_1")).toBe(true);
  });

  it("should be able to check block height", () => {
    const blockHeight = simnet.blockHeight;
    expect(typeof blockHeight).toBe("number");
    expect(blockHeight).toBeGreaterThanOrEqual(0);
  });
});
