# Contributing to BiteBlitz

First off, thanks for taking the time to contribute! 🎉

## How to Contribute
1. **Fork the Repository** and clone your fork locally.
2. **Create a Feature Branch:** `git checkout -b feature/your-feature-name`
3. **Setup Environment:** Use the `.env.example` in `backend/` to provision your local API keys (Stripe, Twilio, Nodemailer, MongoDB).
4. **Run using Docker:** Simply run `docker-compose up --build -d` in the root folder.
5. **Run Tests:** Run `cd backend && npm test` to ensure no active business logic is broken by your changes.
6. **Commit & Push:** Push to your fork and submit a PR against the `main` branch.

## Code Standards
- We utilize ES Modules (`import/export`) cleanly.
- Please append **JSDoc/Swagger Annotations** above any new Express routes you build in `backend/routes/`.
- Frontend code should use functional components, React Context hooks, and lazy loading for heavy images natively via the `<img loading="lazy">` tag.

## Issue Tracking
If you find a bug, please use the `bug_report.md` template located in the `.github/ISSUE_TEMPLATE` folder. Provide clear reproduction steps.
