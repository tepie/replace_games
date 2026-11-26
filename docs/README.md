# Behavior specifications

[`game.feature`](./game.feature) is the declarative Gherkin contract for the player-visible behavior of Laid. It describes expected outcomes, not implementation details or browser selectors.

## Keeping changes aligned

For each behavior change:

1. Capture the requested behavior delta in the relevant Gherkin scenario first.
2. Update the game to satisfy the specification.
3. Add or adjust focused Playwright acceptance tests for the same behavior.
4. Run `npm test` and keep the Gherkin, implementation, and tests in sync.

Keep scenarios declarative and focused on what a player does and observes. Do not add a Cucumber runner just to execute this documentation; Playwright remains the automated test suite.
