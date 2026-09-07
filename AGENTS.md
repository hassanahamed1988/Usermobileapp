# AI Coding Assistant Rules

- **Think Before Acting:** Always take the time to carefully analyze the instructions and the existing codebase before making changes. The codebase is large, and mistakes can cause significant regressions that are hard to undo.
- **Do No Harm:** Provide targeted fixes. Make absolutely sure that the implementation of a new feature or constraint doesn't break or alter unrelated active components or layouts.
- **Respect Boundaries:** Act slowly and precisely, rather than rushing through massive edits. Double-check impacts before performing `edit_file`.
