# AI usage log

## Tools used

- Copilot SDK in VS Code: reviewed the project requirements and helped implement backend and frontend code.
- Git, npm, and Node.js test/lint/build commands: inspected history, changed files, and verified behavior.
- `pdftotext`: extracted the take-home assignment requirements from the provided PDF.
- Integrated browser tools: checked responsive rendering, design CRUD, validation feedback, and confirmation dialogs.

## Key prompts (summarized)

1. Implement the backend requirements in the README, inspect Git history/issues first, and prioritize security and code quality.
2. Build the frontend with mobile/desktop responsive UI, shared Tailwind color tokens in `index.css`, and separate API, service, and presentation layers; keep source files under 300 lines.
3. Replace browser confirmation alerts with a reusable modal component.
4. Read the take-home assignment PDF, compare it with the repository, and implement what is missing.

## One AI mistake and how it was caught

While drafting this log, the AI described a specific CORS test failure as a past mistake without evidence. Checking the Git history with `git log -S` found no matching change, so I removed that unsupported story rather than recording it as fact. This was caught during review of the AI-generated log against the repository history.