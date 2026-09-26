#!/usr/bin/env bash
# Idempotent GitHub setup: labels, milestones and backlog issues (from scripts/backlog.json).
# Usage: scripts/bootstrap-github.sh [owner/repo]   (requires an authenticated `gh`)
set -euo pipefail
REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
cd "$(dirname "$0")/.."

echo "→ Labels"
while IFS='|' read -r name color desc; do
  gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" --force >/dev/null
done <<'LABELS'
good first issue|7057ff|Good for newcomers
help wanted|008672|Extra attention is needed
content|fbca04|Quests, events, texts, lexicon cards
needs-fact-check|d93f0b|Factual content that needs a source review
backend|0e8a16|API, database, server
story|5319e7|Story acts and NPCs
minigame|c2e0c6|Minigames
polish|bfdadc|Juice, art, sound, UX polish
a11y|1d76db|Accessibility
infra|006b75|Docker, deployment, hosting
ci|ededed|Continuous integration
LABELS

echo "→ Milestones"
existing_ms="$(gh api "repos/$REPO/milestones?state=all&per_page=100" -q '.[].title')"
node -e 'for (const m of Object.keys(require("./scripts/backlog.json"))) console.log(m)' | while read -r ms; do
  if ! grep -Fxq "$ms" <<<"$existing_ms"; then
    gh api "repos/$REPO/milestones" -f title="$ms" >/dev/null && echo "  created $ms"
  fi
done

echo "→ Issues"
existing_issues="$(gh issue list --repo "$REPO" --state all --limit 500 --json title -q '.[].title')"
node -e '
const b = require("./scripts/backlog.json")
for (const [ms, issues] of Object.entries(b))
  for (const i of issues) {
    const body = `${i.body}\n\n### Acceptance criteria\n${i.acceptance.map((c) => `- [ ] ${c}`).join("\n")}`
    console.log(JSON.stringify({ ms, title: i.title, labels: i.labels.join(","), body }))
  }' | while read -r line; do
  title="$(jq -r .title <<<"$line")"
  if grep -Fxq "$title" <<<"$existing_issues"; then continue; fi
  gh issue create --repo "$REPO" --title "$title" --label "$(jq -r .labels <<<"$line")" \
    --milestone "$(jq -r .ms <<<"$line")" --body "$(jq -r .body <<<"$line")" >/dev/null
  echo "  created: $title"
done
echo "Done."
