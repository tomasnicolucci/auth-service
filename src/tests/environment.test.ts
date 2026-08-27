import {
  describe,
  expect,
  it,
} from "vitest";

describe("Test environment", () => {
  it("uses the test database", () => {
    expect(
      process.env.DATABASE_URL
    ).toContain("auth_test_db");
  });

  it("uses the test Redis database", () => {
    expect(
      process.env.REDIS_URL
    ).toContain("/1");
  });
});