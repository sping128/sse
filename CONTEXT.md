# Senior Engineer Quest

A gamified self-study app for levelling up to senior software engineer. Solo player, no backend — all state lives in the browser via `progress.js`.

## Language

**Topic**:
A subject area (e.g. "architecture", "databases"). The top-level unit of study. Has a status, XP, and one or more quiz attempts.
_Avoid_: Module, course, subject

**Subtopic**:
A single section within a topic lesson. Completing all subtopics marks the topic as completed.
_Avoid_: Section, chapter, lesson section

**Quiz attempt**:
One sitting of the quiz for a topic — recorded as a date, a percentage score, and a list of question results. A player can make multiple attempts on the same topic.
_Avoid_: Quiz, session, test

**Question result**:
The outcome of a single question within a quiz attempt — whether the player got it correct, and if not, the correct answer. Does not store the player's actual typed answer.
_Avoid_: Answer, response

**Wrong answers (aggregated)**:
The union of all incorrect question results across every quiz attempt for a topic. A question is included if it was ever answered incorrectly — even if later corrected in a subsequent attempt.
_Avoid_: Missed questions, errors

**XP**:
Experience points earned by completing topics and quizzes. Tracks overall progress across the skill tree.
_Avoid_: Points, score
