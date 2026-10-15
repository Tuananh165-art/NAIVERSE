import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const core = readFileSync(new URL("./0001_naiverse_core.sql", import.meta.url), "utf8");
const refresh = readFileSync(new URL("./0033_giang_dien_combo3_current_operator_page.sql", import.meta.url), "utf8");

describe("Giang Dien price refresh migration", () => {
  it("updates only columns defined on price_references", () => {
    const tableBody = core.match(/create table if not exists public\.price_references\s*\(([\s\S]*?)\n\s*\);/i)?.[1];
    const updateBody = refresh.match(/update public\.price_references\s+set([\s\S]*?)\s+where/i)?.[1];
    expect(tableBody).toBeTruthy();
    expect(updateBody).toBeTruthy();
    const tableColumns = new Set(tableBody!.split(/\r?\n/u).flatMap((line) => {
      const column = line.trim().match(/^([a-z_][a-z0-9_]*)\s+/i)?.[1];
      return column && !["check", "constraint", "primary", "unique", "foreign"].includes(column.toLowerCase()) ? [column] : [];
    }));
    const updatedColumns = [...updateBody!.matchAll(/(?:^|,)\s*([a-z_][a-z0-9_]*)\s*=/gim)].map((match) => match[1]);
    expect(updatedColumns).not.toHaveLength(0);
    expect(updatedColumns.filter((column) => !tableColumns.has(column))).toEqual([]);
  });
});
