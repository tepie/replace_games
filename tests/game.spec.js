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

test("warns before allowing a repeated word", async ({ page }) => {
  await fillCurrentRow(page, "eker");
  await page.getByRole("button", { name: "Make a move" }).click();

  await fillCurrentRow(page, "ever");
  await page.getByRole("button", { name: "Make a move" }).click();
  await expect(page.locator("#message")).toHaveText("You've used this word already. Submit again to use it anyway.");
  await expect(page.getByRole("button", { name: "Use repeated word" })).toBeVisible();
  await expect(page.locator("#step-count")).toHaveText("1");
  await expect(page.locator("#path > li")).toHaveCount(3);

  await page.getByRole("button", { name: "Use repeated word" }).click();
  await expect(page.locator("#step-count")).toHaveText("2");
  await expect(page.locator("#path > li").nth(2)).toHaveAttribute("aria-label", "Word 3: EVER");
});

test("editing a repeated guess cancels its confirmation", async ({ page }) => {
  await fillCurrentRow(page, "eker");
  await page.getByRole("button", { name: "Make a move" }).click();

  await fillCurrentRow(page, "ever");
  await page.getByRole("button", { name: "Make a move" }).click();
  await expect(page.getByRole("button", { name: "Use repeated word" })).toBeVisible();

  await fillCurrentRow(page, "eker");
  await expect(page.getByRole("button", { name: "Make a move" })).toBeVisible();
  await expect(page.locator("#message")).toBeEmpty();
  await page.getByRole("button", { name: "Make a move" }).click();
  await expect(page.locator("#message")).toHaveText("Change exactly one letter from your last word.");
  await expect(page.locator("#step-count")).toHaveText("1");
});

test("copies anonymous results with tries, joke odds, and a color-only grid", async ({ page }) => {
  for (const word of ["eker", "sker", "skel", "skil", "skid", "said", "laid"]) {
    await fillCurrentRow(page, word);
    await page.getByRole("button", { name: "Make a move" }).click();
  }

  await expect(page.getByRole("button", { name: "You won!" })).toBeDisabled();
  await expect(page.locator("#win-card")).toBeVisible();
  await expect(page.locator(".share-preview .share-row")).toHaveCount(8);
  await expect(page.getByRole("link", { name: "Explore more games at Hoodsnip.com" })).toHaveAttribute("href", "https://hoodsnip.com");

  await page.getByRole("button", { name: "Copy anonymous results" }).click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  const lines = clipboard.split("\n");
  expect(lines[0]).toBe("LAID (Medium) — 7 tries");
  expect(lines[1]).toBe("Completely unscientific likelihood of getting laid: 95% (just a joke, not a real prediction)");
  expect(lines.at(-1)).toBe("Suggest the next game: https://hoodsnip.com");
  expect(clipboard).not.toContain("EVER");
  expect(clipboard).not.toContain("EKER");
  expect(lines.slice(3, 11)).toEqual([
    "⬜ ⬜ ⬜ ⬜",
    "⬜ ⬜ ⬜ ⬜",
    "⬜ ⬜ ⬜ ⬜",
    "⬜ ⬜ ⬜ 🟨",
    "⬜ ⬜ 🟪 🟨",
    "⬜ ⬜ 🟪 🟪",
    "⬜ 🟪 🟪 🟪",
    "🟪 🟪 🟪 🟪"
  ]);
  expect(lines.slice(3, 11).join("\n")).toMatch(/^[🟪🟨⬜ \n]+$/);
  await expect(page.locator("#share-status")).toHaveText("Copied your anonymous results.");

  await page.getByRole("button", { name: "Restart today's puzzle" }).click();
  await expect(page.locator("#win-card")).toBeHidden();
  await expect(page.locator("#step-count")).toHaveText("0");
});

test("undoing a move restores the previous word and lowers the likelihood score", async ({ page }) => {
  const undoButton = page.getByRole("button", { name: "Undo last move" });
  await expect(undoButton).toBeDisabled();

  await fillCurrentRow(page, "eker");
  await page.getByRole("button", { name: "Make a move" }).click();
  await expect(undoButton).toBeEnabled();
  await expect(page.locator("#step-count")).toHaveText("1");

  await undoButton.click();
  await expect(undoButton).toBeDisabled();
  await expect(page.locator("#step-count")).toHaveText("0");
  await expect(page.locator("#path > li")).toHaveCount(2);

  for (const word of ["eker", "sker", "skel", "skil", "skid", "said", "laid"]) {
    await fillCurrentRow(page, word);
    await page.getByRole("button", { name: "Make a move" }).click();
  }

  await expect(undoButton).toBeDisabled();
  await expect(page.locator("#odds-score")).toHaveText("90%");
});

test("supports mobile-friendly input attributes, overwrite, backspace, and arrow navigation", async ({ page }) => {
  const inputs = page.locator(".current-row .letter");
  await expect(inputs.nth(0)).toHaveAttribute("inputmode", "text");
  await expect(inputs.nth(0)).toHaveAttribute("enterkeyhint", "next");
  await expect(inputs.nth(3)).toHaveAttribute("enterkeyhint", "done");

  await inputs.nth(0).focus();
  await page.keyboard.type("abcd");
  await expect(inputs.nth(0)).toHaveValue("a");
  await expect(inputs.nth(3)).toHaveValue("d");

  await inputs.nth(0).focus();
  await page.keyboard.type("e");
  await expect(inputs.nth(0)).toHaveValue("e");
  await expect(inputs.nth(1)).toBeFocused();

  await page.keyboard.press("ArrowRight");
  await expect(inputs.nth(2)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(inputs.nth(1)).toBeFocused();

  await page.keyboard.press("Backspace");
  await expect(inputs.nth(1)).toHaveValue("");
  await page.keyboard.press("Backspace");
  await expect(inputs.nth(0)).toHaveValue("");
  await expect(inputs.nth(0)).toBeFocused();
});

test("toggles high-contrast colors in the legend and share preview", async ({ page }) => {
  const toggle = page.getByRole("button", { name: "High-contrast colors" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("body")).toHaveClass(/high-contrast/);
  await expect(page.locator("#feedback-legend")).toContainText("Orange");
  await expect(page.locator("#feedback-legend")).toContainText("Blue");

  for (const word of ["eker", "sker", "skel", "skil", "skid", "said", "laid"]) {
    await fillCurrentRow(page, word);
    await page.getByRole("button", { name: "Make a move" }).click();
  }

  await page.getByRole("button", { name: "Copy anonymous results" }).click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain("🟧 🟧 🟧 🟧");
});

test("all daily puzzles start in WORDS and have accurate shortest-path par", async ({ page }) => {
  const results = await page.evaluate(() => {
    function shortestPath(start, goal, words) {
      if (!words.has(start)) return -1;
      const visited = new Set([start]);
      const queue = [[start, 0]];
      const alphabet = "abcdefghijklmnopqrstuvwxyz";
      for (let head = 0; head < queue.length; head += 1) {
        const [word, dist] = queue[head];
        if (word === goal) return dist;
        for (let i = 0; i < 4; i += 1) {
          for (const ch of alphabet) {
            if (ch === word[i]) continue;
            const next = word.slice(0, i) + ch + word.slice(i + 1);
            if (words.has(next) && !visited.has(next)) {
              visited.add(next);
              queue.push([next, dist + 1]);
            }
          }
        }
      }
      return -1;
    }

    const entries = [];
    for (const dayPuzzle of puzzles) {
      for (const tier of ["low", "medium", "high"]) {
        const entry = dayPuzzle[tier];
        entries.push({
          day: dayPuzzle.day,
          tier,
          start: entry.start,
          par: entry.par,
          actual: shortestPath(entry.start, goalWord, window.WORDS)
        });
      }
    }
    return entries;
  });

  for (const entry of results) {
    expect(entry.actual, `${entry.day} ${entry.tier} (${entry.start})`).toBe(entry.par);
  }
});

test("shows selectable share text when clipboard copying is unavailable", async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("Clipboard unavailable"); } }
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: () => false
    });
  });

  for (const word of ["eker", "sker", "skel", "skil", "skid", "said", "laid"]) {
    await fillCurrentRow(page, word);
    await page.getByRole("button", { name: "Make a move" }).click();
  }

  await page.getByRole("button", { name: "Copy anonymous results" }).click();
  const fallback = page.getByRole("textbox", { name: "Anonymous results text" });
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveValue(/LAID \(Medium\) — 7 tries/);
  await expect(fallback).toHaveValue(/Suggest the next game: https:\/\/hoodsnip\.com/);
  await expect(page.locator("#share-status")).toHaveText("Couldn't copy automatically. Select and copy your results below.");
});

test("switching between Low, Medium, and High loads distinct seeds and preserves per-tier progress", async ({ page }) => {
  await expect(page.locator("#path > li").first()).toHaveAttribute("aria-label", "Word 1: EVER");
  await fillCurrentRow(page, "eker");
  await page.getByRole("button", { name: "Make a move" }).click();
  await expect(page.locator("#step-count")).toHaveText("1");

  await page.getByRole("button", { name: "Low" }).click();
  await expect(page.locator("#path > li").first()).toHaveAttribute("aria-label", "Word 1: CLAM");
  await expect(page.locator("#step-count")).toHaveText("0");

  await page.getByRole("button", { name: "High", exact: true }).click();
  await expect(page.locator("#path > li").first()).toHaveAttribute("aria-label", "Word 1: INCH");
  await expect(page.locator("#step-count")).toHaveText("0");

  await page.getByRole("button", { name: "Medium" }).click();
  await expect(page.locator("#step-count")).toHaveText("1");
  await expect(page.locator("#path > li").nth(1)).toHaveAttribute("aria-label", "Word 2: EKER");
});
