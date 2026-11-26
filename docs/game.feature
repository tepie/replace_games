Feature: Daily word ladder
  As a player
  I want to change one letter at a time in valid four-letter words
  So that I can reach LAID and share an anonymous result

  Rule: A local day's puzzle offers three difficulty tiers

    @playwright-switching-between-low-medium-and-high-loads-distinct-seeds-and-preserves-per-tier-progress
    @playwright-all-daily-puzzles-start-in-words-and-have-accurate-shortest-path-par
    Scenario: Start with the medium tier
      Given today's puzzle has Low, Medium, and High tiers
      When the player opens the game
      Then Medium is selected
      And the selected tier's four-letter seed is the first row
      And the goal is LAID
      And the displayed par is the shortest valid path from that seed to LAID

    @playwright-switching-between-low-medium-and-high-loads-distinct-seeds-and-preserves-per-tier-progress
    Scenario: Change tiers without losing progress
      Given the player has made moves in the Medium tier
      When the player switches to Low
      Then the Low tier's seed and progress are shown
      When the player switches back to Medium
      Then the Medium tier's previous path, move count, and timer are restored
      And each tier shows whether it has been solved

  Rule: A move must be a valid four-letter word that differs by one letter

    @playwright-colors-typed-letters-and-rejects-invalid-moves-without-adding-a-row
    Scenario: Submit a valid move
      Given the player is entering a word in the next empty row
      When the player submits a dictionary word differing from the last word by exactly one letter
      Then the word is added as a new row
      And a fresh empty row appears beneath it
      And the move count increases by one

    @playwright-colors-typed-letters-and-rejects-invalid-moves-without-adding-a-row
    Scenario: Reject an invalid move
      Given the player is entering a word in the next empty row
      When the player submits an incomplete word, a non-word, or a word differing by other than one letter
      Then an explanatory error is shown
      And the path and move count do not change

    @playwright-colors-typed-letters-and-rejects-invalid-moves-without-adding-a-row
    Scenario: Show feedback against the goal while entering and after submitting
      Given the goal is LAID
      When a guessed letter matches the goal in the same position
      Then that letter is marked as correct-position feedback
      When a guessed letter appears in LAID in a different position
      Then that letter is marked as present-elsewhere feedback
      And letters absent from LAID remain unmarked
      And the same feedback is shown on submitted rows

    @playwright-warns-before-allowing-a-repeated-word
    Scenario: Confirm before using a repeated word
      Given the player has already used a word in the current path
      When the player submits that word again as a valid one-letter move
      Then the game warns that the word was used before
      And the path and move count remain unchanged
      When the player confirms by submitting the same word again
      Then the repeated word is added to the path
      And the move count increases by one

    @playwright-editing-a-repeated-guess-cancels-its-confirmation
    Scenario: Cancel a repeated-word confirmation by editing the guess
      Given the game is waiting for confirmation of a repeated word
      When the player edits the guess
      Then the confirmation is cancelled
      And the normal move action is restored

  Rule: Players can correct and restart their current tier

    @playwright-undoing-a-move-restores-the-previous-word-and-lowers-the-likelihood-score
    Scenario: Undo the last move
      Given the player has made at least one move and has not won
      When the player chooses to undo
      Then the last word is removed from the path
      And the previous word becomes the current word
      And the move count decreases by one
      And the undo is counted against the fictional likelihood score

    @playwright-undoing-a-move-restores-the-previous-word-and-lowers-the-likelihood-score
    Scenario: Undo is unavailable before the first move and after winning
      Given the player has not made a move or has already reached LAID
      Then undo is unavailable

    @playwright-switching-between-low-medium-and-high-loads-distinct-seeds-and-preserves-per-tier-progress
    @playwright-copies-anonymous-results-with-tries-joke-odds-and-a-color-only-grid
    Scenario: Restart the selected tier
      Given the player has progressed in the selected tier
      When the player restarts today's puzzle
      Then that tier returns to its seed with zero moves and undos
      And its timer and win state are reset
      And progress in the other tiers is unchanged

  Rule: Winning completes the puzzle and shows a clearly fictional score

    @playwright-copies-anonymous-results-with-tries-joke-odds-and-a-color-only-grid
    Scenario: Reach LAID
      Given the player is one valid move away from LAID
      When the player submits LAID
      Then the game shows the complete path and move count
      And the move action changes to "You won!"
      And further moves and undo are unavailable
      And the solved tier is marked as complete
      And a fictional likelihood score is shown
      And confetti and fireworks celebrate the win unless reduced motion is preferred

    @playwright-undoing-a-move-restores-the-previous-word-and-lowers-the-likelihood-score
    @playwright-copies-anonymous-results-with-tries-joke-odds-and-a-color-only-grid
    Scenario: Calculate the fictional likelihood score
      Given the player has completed the puzzle
      Then the score starts at 95 percent
      And each move beyond par reduces it by 10 percentage points
      And each completed 30 seconds reduces it by 5 percentage points
      And each undo reduces it by 5 percentage points
      And the score never falls below 5 percent
      And the score is identified as a joke, not a real prediction

  Rule: The game supports keyboard input and accessible color feedback

    @playwright-supports-mobile-friendly-input-attributes-overwrite-backspace-and-arrow-navigation
    Scenario: Enter a word using a keyboard or mobile keyboard
      Given the player is entering a four-letter word
      When the player types a letter
      Then focus advances to the next letter slot
      And typing into a filled slot replaces its letter
      And arrow keys move between slots
      And backspace clears a slot and can move focus to the previous slot
      And mobile keyboards are given text input and next-or-done hints

    @playwright-toggles-high-contrast-colors-in-the-legend-and-share-preview
    Scenario: Use high-contrast feedback colors
      Given the player is viewing the default feedback colors
      When the player enables high-contrast colors
      Then correct-position feedback is shown in orange
      And present-elsewhere feedback is shown in blue
      And the legend and anonymous share grid use the selected palette

  Rule: Shared results show progress without exposing guessed words

    @playwright-copies-anonymous-results-with-tries-joke-odds-and-a-color-only-grid
    Scenario: Copy anonymous results after winning
      Given the player has completed the puzzle
      When the player copies the anonymous results
      Then the copied text includes the selected difficulty and number of tries
      And it includes the fictional likelihood score and its disclaimer
      And it includes one color-only row for each word in the path
      And it includes a link to play Laid again
      And it includes the Hoodsnip game suggestion link after the Laid link
      But it does not include the words the player entered, their identity, or solve time

    @playwright-toggles-high-contrast-colors-in-the-legend-and-share-preview
    Scenario: Keep share colors consistent with the selected contrast mode
      Given the player has completed the puzzle
      When the player copies anonymous results
      Then correct-position and present-elsewhere colors match the active palette
      And letters absent from the goal use the neutral color

    @playwright-shows-selectable-share-text-when-clipboard-copying-is-unavailable
    Scenario: Provide selectable share text when copying is unavailable
      Given the player has completed the puzzle
      And the browser cannot copy to the clipboard
      When the player requests anonymous results
      Then the complete share text is shown in a selectable field

  Rule: Easter eggs reward playful exploration without changing core rules

    @playwright-cycles-cheeky-title-taglines-after-five-clicks
    Scenario: Reveal cheeky taglines by clicking the title five times
      When the player clicks the LAID title five times
      Then the eyebrow tagline cycles to a cheeky Val Venis greeting

    @playwright-shows-witty-replies-for-playful-non-moves-and-mood-words
    Scenario: Show playful messages for witty non-moves and mood words
      When the player submits a playful non-move word like help or quit
      Then a witty error reply is shown instead of the generic message
      When the player makes a valid move onto a mood word
      Then a playful mood quip is shown

    @playwright-toggles-blind-mode-via-legend-or-konami-code
    Scenario: Toggle blind mode to hide color hints
      When the player double-clicks the feedback legend or enters the Konami code
      Then blind mode is toggled to hide or restore color hints

    @playwright-awards-scenic-route-rank-and-late-night-note-on-win
    Scenario: Show late-night and scenic-route flavor on the win card
      Given the player solves the puzzle late at night or in twenty or more moves
      Then the win card displays the matching playful rank or late-night note
