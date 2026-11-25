import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "../../utils/password";

describe("Password utils", () => {
  const password = "my-secret-password";

  it("hashes a password", async () => {
    const passwordHash = await hashPassword(password);
    expect(passwordHash).toBeDefined();
    expect(passwordHash).not.toBe(password);
  });

  it("verifies a password", async () => {
    const hash = await hashPassword(password);

    const result = await verifyPassword(password, hash);

    expect(result).toBe(true);
  });

  it("rejects incorrect password", async () => {
    const hash = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash).not.toBe(hash2);
  });
});
