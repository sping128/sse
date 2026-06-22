# Quiz question results stored in progress.js, written by Claude post-quiz

The quiz is conducted in chat with Claude, not in the browser app. Rather than build a separate persistence layer, Claude writes the full question results (question text, correct/incorrect, and the correct answer for wrong questions) directly into `progress.js` as part of the post-quiz update it already performs.

The review UI on `lesson.html` reads from this data and displays the aggregated wrong answers — the union of all incorrect question results across every quiz attempt for that topic, including questions later answered correctly in a subsequent attempt.

Per-attempt history was considered but rejected: the player's goal is to identify weak spots, not audit their improvement arc. Aggregation gives a cleaner, actionable list.
