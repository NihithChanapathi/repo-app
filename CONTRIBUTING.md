# Contributing to Repo

Thanks for helping build Repo. This guide keeps the codebase clean while a small team moves fast.

## Getting set up

1. Clone the repository and install dependencies:

   ```bash
   git clone <repo-url>
   cd <repo-folder>
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key
   (ask Nihith for them privately; never post them in GitHub issues, pull requests or chat).
3. Start the app with `npm run dev` and open http://localhost:3000.

See `README.md` for the full Supabase setup.

## How we work

- **`main` is always working.** Nobody commits to it directly; every change goes through a pull request.
- **One change per branch.** Create a branch from an up-to-date `main`:

  ```bash
  git checkout main
  git pull
  git checkout -b feat/short-description
  ```

  Branch prefixes: `feat/` new feature, `fix/` bug fix, `docs/` documentation, `chore/` tooling or cleanup, `test/` tests.
- **Track work in Issues.** Every task or bug has a GitHub Issue. Reference it in the pull request with `Closes #12`.
- **Keep pull requests small** (ideally under about 300 changed lines) so they are easy to review.

## Commit messages

Use the format `type: short summary in the present tense`, for example:

```
feat: add profile page with editable display name
fix: stop duplicate chats when tapping Message seller twice
docs: explain Supabase redirect URLs in README
```

Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`.

## Before you open a pull request

Run these locally. Pull requests are expected to pass all of them:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Also check that no secrets are included (`.env.local` must never be committed) and, for visible changes,
attach a screenshot, ideally of the phone-sized layout.

## Review

- At least one teammate looks at every pull request that touches code.
- Reviewers: check that it works, that it is understandable, and that it does not weaken security
  (especially anything involving the database or row-level security).
- Merge with **Squash and merge** so `main` keeps one clean commit per change.

## Database changes

Schema changes live in `supabase/` and must keep row-level security enabled on every table.
Explain any policy changes in the pull request description.

## Security

Never commit passwords, API keys, service-role keys or `.env*` files (except `.env.example`).
If a secret is committed by accident, tell Nihith right away so it can be rotated.
