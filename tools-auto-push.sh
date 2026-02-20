#!/usr/bin/env bash
set -euo pipefail

# Simple auto-commit + push loop using git status polling.
# Usage: ./tools-auto-push.sh [interval_seconds]
# Optional env:
#   COMMIT_PREFIX="auto"   # commit message prefix
#   QUIET_SECONDS=3         # debounce time after detecting changes
#

INTERVAL_SECONDS="${1:-2}"
QUIET_SECONDS="${QUIET_SECONDS:-3}"
COMMIT_PREFIX="${COMMIT_PREFIX:-auto}"

cd "$(dirname "$0")"
cd "$(pwd)"/.. 2>/dev/null || cd "$(git rev-parse --show-toplevel)"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not inside a git repository." >&2
  exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD)"

while true; do
  if [ -n "$(git status --porcelain)" ]; then
    # Debounce: wait for changes to settle
    sleep "$QUIET_SECONDS"
    if [ -n "$(git status --porcelain)" ]; then
      ts="$(date +"%Y-%m-%d %H:%M:%S")"
      msg="$COMMIT_PREFIX: $ts"
      git add -A
      # Avoid empty commit
      if ! git diff --cached --quiet; then
        git commit -m "$msg" || true
        git push origin "$branch" || true
      fi
    fi
  fi
  sleep "$INTERVAL_SECONDS"
done
