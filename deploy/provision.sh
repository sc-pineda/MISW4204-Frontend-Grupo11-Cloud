#!/bin/bash
# Provisioning script for MISW4204 Entrega 2 — idempotent re-creation of GCP infra.
# Run from a machine with gcloud CLI authed as a project owner.
#
# Usage: ./provision.sh
set -euo pipefail

PROJECT="${PROJECT:-miso-494501}"
REGION="${REGION:-us-central1}"
ZONE="${ZONE:-us-central1-a}"

FILES_BUCKET="${PROJECT}-files"
SA_NAME="vm-runtime"
SA_EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
VM_NAME="entrega2-vm"
FW_RULE="allow-http-api"

echo ">> project=$PROJECT region=$REGION zone=$ZONE"
gcloud config set project "$PROJECT"

echo ">> enabling APIs"
gcloud services enable \
  compute.googleapis.com \
  sqladmin.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  artifactregistry.googleapis.com \
  storage.googleapis.com

echo ">> files bucket"
gcloud storage buckets create "gs://$FILES_BUCKET" --location="$REGION" --uniform-bucket-level-access || true

echo ">> service account"
gcloud iam service-accounts create "$SA_NAME" --display-name="VM runtime SA" || true
gcloud storage buckets add-iam-policy-binding "gs://$FILES_BUCKET" --member="serviceAccount:$SA_EMAIL" --role=roles/storage.objectAdmin

echo ">> firewall rule"
gcloud compute firewall-rules create "$FW_RULE" \
  --direction=INGRESS --action=ALLOW \
  --rules=tcp:80,tcp:8080 --source-ranges=0.0.0.0/0 \
  --target-tags=http-api 2>/dev/null || true

echo ">> VM"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
gcloud compute instances create "$VM_NAME" \
  --zone="$ZONE" \
  --machine-type=e2-small \
  --image-family=debian-12 --image-project=debian-cloud \
  --boot-disk-size=20GB --boot-disk-type=pd-standard \
  --service-account="$SA_EMAIL" \
  --scopes=cloud-platform \
  --tags=http-api \
  --metadata-from-file=startup-script="$SCRIPT_DIR/vm-startup.sh" || true

echo ">> done. external IP:"
gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --format="value(networkInterfaces[0].accessConfigs[0].natIP)"
