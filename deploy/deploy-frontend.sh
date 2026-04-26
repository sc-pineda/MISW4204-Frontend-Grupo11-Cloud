#!/bin/bash
# Build the Angular frontend as static files and upload to gs://miso-494501-web.
# Must run from this `deploy/` directory.
set -euo pipefail

PROJECT="${PROJECT:-miso-494501}"
WEB_BUCKET="${PROJECT}-web"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../misw4204-web" && pwd)"
API_BASE_URL="${API_BASE_URL:?must export API_BASE_URL=http://<vm-ip>:8080 before running}"

echo ">> building frontend at $APP_DIR (API_BASE_URL=$API_BASE_URL)"
cd "$APP_DIR"
npm ci
# `ng build` produces dist/<app>/browser when SSR is enabled
npm run build -- --configuration=production
DIST_BROWSER="$APP_DIR/dist/misw4204-web/browser"
test -d "$DIST_BROWSER" || { echo "missing $DIST_BROWSER"; exit 1; }

echo ">> uploading to gs://$WEB_BUCKET"
gcloud storage rsync -r "$DIST_BROWSER" "gs://$WEB_BUCKET" --delete-unmatched-destination-objects

echo ">> done. URL: https://storage.googleapis.com/$WEB_BUCKET/index.html"
