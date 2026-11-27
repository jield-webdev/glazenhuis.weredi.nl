#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/apps/cms"
# Never create this directory as a fallback: without the mount, uploads would be lost.
uploads=${CMS_UPLOADS_PATH:-/mounts/glazenhuis-uploads}
if [[ "$uploads" != /* ]] || ! mountpoint -q -- "$uploads"; then
  echo "CMS upload storage is not mounted at $uploads. Configure the Azure Files mount before starting." >&2
  exit 1
fi
if ! probe=$(mktemp "$uploads/.glazenhuis-write-check.XXXXXX"); then
  echo "CMS upload storage is not writable at $uploads." >&2
  exit 1
fi
rm -- "$probe"
mkdir -p public
if [[ -L public/uploads ]]; then
  # Replace old release links without deleting any files in their target.
  if [[ "$(readlink public/uploads)" != "$uploads" ]]; then
    rm public/uploads
    ln -s "$uploads" public/uploads
  fi
else
  if [[ -e public/uploads ]] && ! rmdir public/uploads; then
    echo 'public/uploads contains files. Migrate them to Azure Files before deploying.' >&2
    exit 1
  fi
  ln -s "$uploads" public/uploads
fi
export HOST=0.0.0.0
export PORT="${PORT:-8080}"
exec node ../../node_modules/@strapi/strapi/bin/strapi.js start
