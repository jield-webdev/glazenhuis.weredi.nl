#!/usr/bin/env bash
set -euo pipefail
# Installed root-owned at /usr/local/bin/glazenhuis-deploy. Invoked as deploy user.
sha=${1:?Usage: glazenhuis-deploy COMMIT_SHA}
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid commit SHA' >&2; exit 1; }
base=/var/lib/glazenhuis
exec 9>"$base/deploy.lock"
flock -n 9 || { echo 'Another deployment is running' >&2; exit 1; }
release="$base/releases/$sha"
[[ ! -e "$release" ]] || { echo 'Release already exists; use a new commit or documented rollback' >&2; exit 1; }
git -C "$base/repository" fetch --prune origin main
git -C "$base/repository" merge-base --is-ancestor "$sha" origin/main
mkdir -p "$release"
git -C "$base/repository" archive "$sha" | tar -x -C "$release"
ln -s "$base/shared/cms.env" "$release/apps/cms/.env"
ln -s "$base/shared/web.env" "$release/apps/web/.env"
rm -rf "$release/apps/cms/public/uploads"
ln -s "$base/shared/uploads" "$release/apps/cms/public/uploads"
cd "$release"
npm ci --include=dev
npm test
npm run typecheck
npm run build
previous=$(readlink -f "$base/current" || true)
ln -s "$release" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
sudo /usr/bin/systemctl restart glazenhuis-cms glazenhuis-web
healthy=false
for attempt in {1..30}; do
 if curl --fail --silent http://127.0.0.1:3005/api/health >/dev/null; then healthy=true; break; fi
 sleep 2
done
if [[ "$healthy" != true ]]; then
 if [[ -n "$previous" ]]; then
  ln -s "$previous" "$base/current.rollback"
  mv -Tf "$base/current.rollback" "$base/current"
  sudo /usr/bin/systemctl restart glazenhuis-cms glazenhuis-web
 fi
 echo 'Health check failed. Previous code restored where available; inspect database migrations before retrying.' >&2
 exit 1
fi
echo "Deployed $sha"
