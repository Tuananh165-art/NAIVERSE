import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "./auth-error";

describe("getAuthErrorMessage", () => {
  it("explains that a Supabase 429 is a rate limit", () => {
    expect(getAuthErrorMessage({ status: 429 }, "en")).toContain("limiting");
    expect(getAuthErrorMessage({ code: "over_email_send_rate_limit" }, "vi")).toContain("giới hạn");
  });

  it("keeps credential failures generic", () => {
    expect(getAuthErrorMessage({ code: "invalid_credentials" }, "en")).toBe(
      "Unable to authenticate. Check your sign-in details and try again.",
    );
  });

  it("gives a recovery path for an unconfirmed email", () => {
    expect(getAuthErrorMessage({ code: "email_not_confirmed" }, "en")).toContain("confirmation email");
  });
});
