#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"
DEST="$ROOT_DIR/src/graphql/schema.gql"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[codegen-pre] .env.local not found at $ENV_FILE" >&2
  exit 1
fi

# .env.local 에서 LOCAL_DEV_API_FOLDER 값만 안전하게 추출 (따옴표 제거)
LOCAL_DEV_API_FOLDER="$(
  grep -E '^[[:space:]]*LOCAL_DEV_API_FOLDER[[:space:]]*=' "$ENV_FILE" \
    | tail -n 1 \
    | sed -E 's/^[[:space:]]*LOCAL_DEV_API_FOLDER[[:space:]]*=[[:space:]]*//' \
    | sed -E 's/^"(.*)"$/\1/' \
    | sed -E "s/^'(.*)'\$/\\1/"
)"

if [[ -z "${LOCAL_DEV_API_FOLDER:-}" ]]; then
  echo "[codegen-pre] LOCAL_DEV_API_FOLDER is not set in .env.local" >&2
  exit 1
fi

SRC="$LOCAL_DEV_API_FOLDER/src/schema.gql"

if [[ ! -f "$SRC" ]]; then
  echo "[codegen-pre] source schema not found: $SRC" >&2
  exit 1
fi

mkdir -p "$(dirname "$DEST")"
cp "$SRC" "$DEST"
echo "[codegen-pre] copied $SRC -> $DEST"