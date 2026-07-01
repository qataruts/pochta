#!/usr/bin/env bash
# Run a Pochta relay from a self-contained release — NO Elixir or Node needed.
# Generates + persists a secret and keeps all data (SQLite + relay key) in one
# folder, so a non-technical host just runs this once.
#
#   ./pochta-server.sh                 # http://localhost:4000, data in ~/.pochta
#   PORT=8080 POCHTA_DATA=/srv/pochta ./pochta-server.sh
#   ADMIN_TOKEN=$(openssl rand -hex 16) ./pochta-server.sh   # enable the /admin panel
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"

# Find the release binary: $POCHTA_RELEASE, next to this script, or the repo build.
bin="${POCHTA_RELEASE:-}"
if [ -z "$bin" ]; then
  for c in \
    "$here/bin/pochta" \
    "$here/../apps/server/_build/prod/rel/pochta/bin/pochta"; do
    [ -x "$c" ] && bin="$c" && break
  done
fi
if [ -z "$bin" ] || [ ! -x "$bin" ]; then
  echo "Pochta release not found."
  echo "Build it (needs Elixir) with:  cd apps/server && MIX_ENV=prod mix release"
  echo "or set POCHTA_RELEASE=/path/to/rel/pochta/bin/pochta"
  exit 1
fi

data="${POCHTA_DATA:-$HOME/.pochta}"
mkdir -p "$data"
secret="$data/secret_key_base"
[ -f "$secret" ] || openssl rand -base64 48 >"$secret"

export SECRET_KEY_BASE="$(cat "$secret")"
export PHX_SERVER=true
export PORT="${PORT:-4000}"
export DATABASE_PATH="$data/chat.db"
export RELAY_KEY_PATH="$data/relay_identity.key"

echo "Pochta relay → http://localhost:$PORT   (data: $data)"
[ -n "${ADMIN_TOKEN:-}" ] && echo "Admin panel  → http://localhost:$PORT/admin"
exec "$bin" start
