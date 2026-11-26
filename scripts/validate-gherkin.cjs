const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { AstBuilder, GherkinClassicTokenMatcher, Parser } = require("@cucumber/gherkin");
const { IdGenerator } = require("@cucumber/messages");

const featurePath = resolve(__dirname, "../docs/game.feature");
const testPath = resolve(__dirname, "../tests/game.spec.js");
const featureSource = readFileSync(featurePath, "utf8");
const testSource = readFileSync(testPath, "utf8");
const parser = new Parser(
  new AstBuilder(IdGenerator.uuid()),
  new GherkinClassicTokenMatcher()
);

let document;
try {
  document = parser.parse(featureSource);
} catch (error) {
  console.error(`Invalid Gherkin in ${featurePath}:`);
  console.error(error.message);
  process.exit(1);
}

function collectScenarios(children, scenarios = []) {
  for (const child of children ?? []) {
    if (child.scenario) scenarios.push(child.scenario);
    if (child.rule) collectScenarios(child.rule.children, scenarios);
  }
  return scenarios;
}

function toSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const feature = document.feature;
if (!feature) {
  console.error(`No Feature found in ${featurePath}.`);
  process.exit(1);
}

const scenarios = collectScenarios(feature.children);
const testTitles = [...testSource.matchAll(/\btest\(\s*"([^"]+)"\s*,/g)].map(match => match[1]);
const testSlugs = new Set(testTitles.map(toSlug));
const mappedTestSlugs = new Set();
const errors = [];

if (scenarios.length === 0) errors.push("The feature must contain at least one Scenario.");
if (testTitles.length === 0) errors.push(`No Playwright tests found in ${testPath}.`);

for (const scenario of scenarios) {
  const links = scenario.tags
    .map(tag => tag.name)
    .filter(name => name.startsWith("@playwright-"))
    .map(name => name.slice("@playwright-".length));

  if (links.length === 0) {
    errors.push(`Scenario "${scenario.name}" has no @playwright-<test-title> tag.`);
    continue;
  }

  for (const link of links) {
    if (!testSlugs.has(link)) {
      errors.push(`Scenario "${scenario.name}" references a missing Playwright test: "${link}".`);
    } else {
      mappedTestSlugs.add(link);
    }
  }
}

for (const title of testTitles) {
  const slug = toSlug(title);
  if (!mappedTestSlugs.has(slug)) {
    errors.push(`Playwright test "${title}" is not linked from ${featurePath}.`);
  }
}

if (errors.length > 0) {
  console.error("Gherkin validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated Gherkin syntax and Playwright links for ${scenarios.length} scenarios.`);
