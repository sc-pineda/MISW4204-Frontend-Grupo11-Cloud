#!/bin/bash
# Rebuild the Angular frontend from origin/feature/profesor and redeploy to entrega2-vm.
# Re-run any time the frontend branch gets new commits.
#
# Usage:   ./redeploy-frontend.sh
#          BRANCH=origin/develop ./redeploy-frontend.sh   # if/once feature/profesor merges
set -euo pipefail

FRONTEND_REPO="${FRONTEND_REPO:-$HOME/Codigo/MISW4204-Frontend-Grupo11-Cloud}"
BRANCH="${BRANCH:-origin/develop}"
ZONE="${ZONE:-us-central1-a}"
VM="${VM:-entrega2-vm}"

if ! command -v gcloud >/dev/null 2>&1; then
  source "$HOME/google-cloud-sdk/path.bash.inc"
fi

echo ">> fetching latest from $FRONTEND_REPO"
git -C "$FRONTEND_REPO" fetch origin

DEPLOY_SHA="$(git -C "$FRONTEND_REPO" rev-parse --short "$BRANCH")"
echo ">> deploying $BRANCH @ $DEPLOY_SHA"

STAGE=/tmp/frontend-build
rm -rf "$STAGE"
mkdir -p "$STAGE"
git -C "$FRONTEND_REPO" archive --format=tar "$BRANCH" | tar -x -C "$STAGE"

echo ">> npm ci + ng build"
cd "$STAGE/misw4204-web"
npm ci --no-audit --no-fund
npm run build

DIST="$STAGE/misw4204-web/dist/misw4204-web/browser"
test -d "$DIST" || { echo "missing $DIST"; exit 1; }

# Angular SSR config produces index.csr.html instead of index.html
[ -f "$DIST/index.csr.html" ] && mv "$DIST/index.csr.html" "$DIST/index.html"
test -f "$DIST/index.html" || { echo "no index.html in $DIST"; exit 1; }

echo ">> SCP to VM"
gcloud compute scp --recurse --zone="$ZONE" "$DIST" "$VM:/tmp/web-new" >/dev/null

echo ">> swap and restart nginx"
gcloud compute ssh "$VM" --zone="$ZONE" --command='
set -e
sudo rm -rf /opt/app/web
sudo mv /tmp/web-new /opt/app/web
# Restart (not reload) — rm+mv changes the directory inode, and the bind mount
# inside the container would otherwise still point at the old (deleted) inode.
sudo docker compose -f /opt/app/docker-compose.yml restart nginx
'

IP="$(gcloud compute instances describe "$VM" --zone="$ZONE" --format="value(networkInterfaces[0].accessConfigs[0].natIP)")"
echo ">> done. http://$IP/  ($DEPLOY_SHA)"
