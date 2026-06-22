# Senior Engineer Quest

A self-study web app for levelling up to senior software engineer.

## Stack
- Vanilla HTML/JS — no build step, open files directly in browser
- `progress.js` — single source of truth for all game state (XP, scores, topic status)
- `lessons.js` — lesson content keyed by topic ID
- `index.html` — skill tree UI, reads from `progress.js`
- `lesson.html` — lesson reader, reads from `progress.js` and `lessons.js`

## Workflow
1. User reads a lesson in `lesson.html`
2. Claude quizzes the user in chat
3. After the quiz, update `progress.js`:
   - `topics[id].status` → `"completed"` if all subtopics done
   - `topics[id].xp_earned` — increment
   - `topics[id].quiz_scores` — append `{ date, pct }`
   - `topics[id].completed_subtopics` — array of completed indices
   - `player.xp`, `player.streak`, `player.lastActive`

No separate tracker file — `progress.js` is the only place to update.
