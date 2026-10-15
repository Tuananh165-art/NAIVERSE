import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";

const require = createRequire(`${process.cwd()}/package.json`);
const axeScriptPath = require.resolve("axe-core/axe.min.js");
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const auditRoutes = ["/vi", "/en", "/vi/places", "/vi/auth", "/en/ai/guide", "/vi/ai/fair-price"];

test("core Vietnamese and English pages have no axe WCAG 2.1 A/AA violations", async ({ page }) => {
  const findings: Array<{ route: string; violations: Array<{ id: string; impact: string | null; help: string; nodes: string[] }> }> = [];

  for (const route of auditRoutes) {
    await page.goto(route);
    if (route === "/vi/auth") await page.getByRole("button", { name: "Tạo tài khoản" }).click();
    await page.addScriptTag({ path: axeScriptPath });
    const violations = await page.evaluate(async (tags) => {
      type AxeResults = { violations: Array<{ id: string; impact: string | null; help: string; nodes: Array<{ target: string[]; failureSummary?: string }> }> };
      const axe = Reflect.get(window, "axe") as { run: (document: Document, options: { runOnly: { type: string; values: string[] } }) => Promise<AxeResults> };
      const result = await axe.run(document, { runOnly: { type: "tag", values: tags } });
      return result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.map((node) => node.target.join(" ")),
      }));
    }, wcagTags);
    findings.push({ route, violations });
  }

  expect(findings.filter((finding) => finding.violations.length > 0)).toEqual([]);
});
