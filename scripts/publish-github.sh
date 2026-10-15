#!/usr/bin/env bash
set -euo pipefail
# Explicit, user-initiated GitHub publication. Run from the repository root.
REPO_NAME="${1:-reim-open}"
VISIBILITY="${2:-public}"
if [[ "${VISIBILITY}" != "public" && "${VISIBILITY}" != "private" ]]; then
  echo "Usage: bash scripts/publish-github.sh [repo-name] [public|private]" >&2; exit 2
fi
if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI is required: https://cli.github.com/" >&2; exit 1
fi
gh auth status >/dev/null || { echo "Run gh auth login first"; exit 1; }
if [[ ! -d .git ]]; then git init -b main; fi
if [[ -z "$(git config --get user.name || true)" ]] || [[ -z "$(git config --get user.email || true)" ]]; then
  echo 'Configure your git user.name and user.email before publishing.' >&2; exit 1
fi
npm test
node scripts/build-standalone.mjs
node scripts/package-skill.mjs
git add README.md LICENSE package.json docs/ standalone/ bin/ examples/ skills/ scripts/ tests/ .gitignore .github/
if ! git diff --cached --quiet; then git commit -m "Release REIM Open v$(node -p 'require("./package.json").version')"; fi
if gh repo view "$REPO_NAME" >/dev/null 2>&1; then
  echo "Repository named $REPO_NAME already exists; refusing to overwrite. Choose a new name." >&2;exit 1
fi
gh repo create "$REPO_NAME" "--$VISIBILITY" --source=. --remote=origin --push
printf '\nPublished! Enable GitHub Pages in repo Settings → Pages → main /docs.\n'
