#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
destination=${1:?Usage: bash deploy/azure/package.sh OUTPUT_DIRECTORY}
test -f apps/web/.next/standalone/apps/web/server.js
test -f apps/cms/dist/src/index.js
test -f apps/cms/dist/build/index.html
mkdir -p "$destination"
destination=$(cd "$destination" && pwd)
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
mkdir -p "$stage/web" "$stage/cms/apps/cms" "$stage/cms/apps/web"
cp -R apps/web/.next/standalone/. "$stage/web/"
cp -R apps/web/public "$stage/web/apps/web/"
cp -R apps/web/.next/static "$stage/web/apps/web/.next/"
cp deploy/azure/web-start.sh "$stage/web/start.sh"
# Strapi uses this repository's shared npm lockfile and hoisted dependencies.
cp package.json package-lock.json "$stage/cms/"
cp -R node_modules "$stage/cms/"
cp apps/web/package.json "$stage/cms/apps/web/"
cp apps/cms/package.json apps/cms/tsconfig.json "$stage/cms/apps/cms/"
cp -R apps/cms/dist apps/cms/config apps/cms/src apps/cms/public apps/cms/certs "$stage/cms/apps/cms/"
if [[ -d apps/cms/node_modules ]]; then
  cp -R apps/cms/node_modules "$stage/cms/apps/cms/"
fi
rm -rf "$stage/cms/apps/cms/public/uploads"
cp deploy/azure/cms-start.sh "$stage/cms/start.sh"
# Next standalone tracing can copy local environment files. Never ship these.
find "$stage" -type f \( -name '.env' -o -name '.env.*' \) -delete
(cd "$stage/web" && zip -1qr "$stage/web.zip" .)
(cd "$stage/cms" && zip -1qr "$stage/cms.zip" .)
mv "$stage/web.zip" "$destination/web.zip"
mv "$stage/cms.zip" "$destination/cms.zip"
