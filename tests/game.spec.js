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

test("copies anonymous results with tries, joke odds, and a color-only grid", async ({ page }) => {
  for (const word of ["eker", "sker", "skel", "skil", "skid", "said", "laid"]) {
    await fillCurrentRow(page, word);
    await page.getByRole("button", { name: "Make a move" }).click();
  }

  await expect(page.getByRole("button", { name: "You won!" })).toBeDisabled();
  await expect(page.locator("#win-card")).toBeVisible();
  await expect(page.locator(".share-preview .share-row")).toHaveCount(8);
  await expect(page.getByRole("link", { name: "Hoodsnip.com" })).toHaveAttribute("href", "https://hoodsnip.com");

  await page.getByRole("button", { name: "Copy anonymous results" }).click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  const lines = clipboard.split("\n");
  expect(lines[0]).toBe("LAID — 7 tries");
  expect(lines[1]).toBe("Completely unscientific likelihood of getting laid: 95% (just a joke, not a real prediction)");
  expect(lines.at(-1)).toBe("Suggest the next game: https://hoodsnip.com");
  expect(clipboard).not.toContain("EVER");
  expect(clipboard).not.toContain("EKER");
  expect(lines.slice(3, 11)).toEqual([
    "⬜ ⬜ ⬜ ⬜",
    "⬜ ⬜ ⬜ ⬜",
    "⬜ ⬜ ⬜ ⬜",
    "⬜ ⬜ ⬜ 🟨",
    "⬜ ⬜ 🟩 🟨",
    "⬜ ⬜ 🟩 🟩",
    "⬜ 🟩 🟩 🟩",
    "🟩 🟩 🟩 🟩"
  ]);
  expect(lines.slice(3, 11).join("\n")).toMatch(/^[🟩🟨⬜ \n]+$/);
  await expect(page.locator("#share-status")).toHaveText("Copied your anonymous results.");

  await page.getByRole("button", { name: "Restart today's puzzle" }).click();
  await expect(page.locator("#win-card")).toBeHidden();
  await expect(page.locator("#step-count")).toHaveText("0");
});
