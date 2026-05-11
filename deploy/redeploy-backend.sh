#!/bin/bash
# Redeploy the Go backend to entrega2-vm from the latest origin/develop.
# Re-run any time the backend repo gets new commits on develop.
#
# Usage:   ./redeploy-backend.sh                 # uses defaults
#          BRANCH=origin/feature/X ./redeploy-backend.sh
#          BACKEND_REPO=/path/to/repo ./redeploy-backend.sh
set -euo pipefail

BACKEND_REPO="${BACKEND_REPO:-$HOME/Codigo/202612-MISW4204-Grupo11}"
BRANCH="${BRANCH:-origin/develop}"
ZONE="${ZONE:-us-central1-a}"
VM="${VM:-entrega2-vm}"

if ! command -v gcloud >/dev/null 2>&1; then
  source "$HOME/google-cloud-sdk/path.bash.inc"
fi

echo ">> fetching latest from $BACKEND_REPO"
git -C "$BACKEND_REPO" fetch origin

DEPLOY_SHA="$(git -C "$BACKEND_REPO" rev-parse --short "$BRANCH")"
echo ">> deploying $BRANCH @ $DEPLOY_SHA"

STAGE=/tmp/backend-deploy
rm -rf "$STAGE"
mkdir -p "$STAGE"
git -C "$BACKEND_REPO" archive --format=tar "$BRANCH" | tar -x -C "$STAGE"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ">> SCP backend code + compose to VM"
gcloud compute scp --recurse --zone="$ZONE" "$STAGE" "$VM:/tmp/backend-new" >/dev/null
gcloud compute scp --zone="$ZONE" "$SCRIPT_DIR/docker-compose.vm.yml" "$VM:/tmp/docker-compose.yml" >/dev/null

echo ">> swap and rebuild api container"
gcloud compute ssh "$VM" --zone="$ZONE" --command='
set -e
sudo rm -rf /opt/app/backend
sudo mv /tmp/backend-new /opt/app/backend
sudo mv /tmp/docker-compose.yml /opt/app/docker-compose.yml
cd /opt/app
sudo docker compose --env-file .env up -d --build api
sudo docker compose ps api
'

IP="$(gcloud compute instances describe "$VM" --zone="$ZONE" --format="value(networkInterfaces[0].accessConfigs[0].natIP)")"
echo ">> done. http://$IP/  ($DEPLOY_SHA)"
