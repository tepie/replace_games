# Behavior specifications

[`game.feature`](./game.feature) is the declarative Gherkin contract for the player-visible behavior of Laid. It describes expected outcomes, not implementation details or browser selectors.

## Keeping changes aligned

For each behavior change:

1. Capture the requested behavior delta in the relevant Gherkin scenario first.
2. Update the game to satisfy the specification.
3. Add or adjust focused Playwright acceptance tests for the same behavior.
4. Link each Gherkin scenario to its Playwright test with an `@playwright-<test-title>` tag. Convert the test title to lowercase kebab-case for the tag.
5. Run `npm test` and keep the Gherkin, implementation, and tests in sync.

`npm run test:gherkin` parses the feature with Cucumber's Gherkin parser and checks that every scenario links to an existing Playwright test and every Playwright test is linked from a scenario. This catches syntax errors, unlinked scenarios or tests, and stale test references. The links provide traceability, not proof that every scenario step is asserted; review the associated Playwright assertions when changing behavior.

Keep scenarios declarative and focused on what a player does and observes. A Cucumber step-definition runner is not needed; Playwright remains the automated behavior test suite.
