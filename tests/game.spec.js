const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-25T12:00:00") });
  await page.goto("/laid.html");
});

async function fillCurrentRow(page, word) {
  const inputs = page.locator(".current-row .letter");
  for (let index = 0; index < word.length; index += 1) {
    await inputs.nth(index).fill(word[index]);
  }
}

test("colors typed letters and rejects invalid moves without adding a row", async ({ page }) => {
  const inputs = page.locator(".current-row .letter");
  await fillCurrentRow(page, "dial");

  for (let index = 0; index < 4; index += 1) {
    await expect(inputs.nth(index)).toHaveClass(/goal-present/);
  }

  await page.getByRole("button", { name: "Make a move" }).click();
  await expect(page.locator("#message")).toHaveText("Change exactly one letter from your last word.");
  await expect(page.locator("#path > li")).toHaveCount(2);

  await fillCurrentRow(page, "eker");
  await page.getByRole("button", { name: "Make a move" }).click();
  await expect(page.locator("#path > li")).toHaveCount(3);
  await expect(page.locator("#path > li").nth(1)).toHaveAttribute("aria-label", "Word 2: EKER");
});

test("copies an anonymous color-only grid after winning", async ({ page }) => {
  for (const word of ["eker", "sker", "skel", "skil", "skid", "said", "laid"]) {
    await fillCurrentRow(page, word);
    await page.getByRole("button", { name: "Make a move" }).click();
  }

  await expect(page.getByRole("button", { name: "You won!" })).toBeDisabled();
  await expect(page.locator("#win-card")).toBeVisible();
  await expect(page.locator(".share-preview .share-row")).toHaveCount(8);

  await page.getByRole("button", { name: "Copy anonymous grid" }).click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe([
    "⬜ ⬜ ⬜ ⬜",
    "⬜ ⬜ ⬜ ⬜",
    "⬜ ⬜ ⬜ ⬜",
    "⬜ ⬜ ⬜ 🟨",
    "⬜ ⬜ 🟩 🟨",
    "⬜ ⬜ 🟩 🟩",
    "⬜ 🟩 🟩 🟩",
    "🟩 🟩 🟩 🟩"
  ].join("\n"));
  expect(clipboard).toMatch(/^[🟩🟨⬜ \n]+$/);
  await expect(page.locator("#share-status")).toHaveText("Copied the color-only grid.");

  await page.getByRole("button", { name: "Restart today's puzzle" }).click();
  await expect(page.locator("#win-card")).toBeHidden();
  await expect(page.locator("#step-count")).toHaveText("0");
});
