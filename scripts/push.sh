#!/usr/bin/env bash
# Push para GitHub usando o token em ../.github-token.local (opção 3)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOKEN_FILE="${ROOT}/../.github-token.local"
BRANCH="${1:-main}"
REMOTE="${GITHUB_REMOTE:-DrakkonxJH/obrascity}"

if [[ ! -f "$TOKEN_FILE" ]]; then
  echo "Erro: token não encontrado em $TOKEN_FILE"
  exit 1
fi

TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"
cd "$ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Aviso: há alterações não commitadas. Faça commit antes do push."
  git status --short
  exit 1
fi

echo "→ Enviando ${BRANCH} para github.com/${REMOTE}..."
git push "https://x-access-token:${TOKEN}@github.com/${REMOTE}.git" "$BRANCH"
echo "Concluído."
