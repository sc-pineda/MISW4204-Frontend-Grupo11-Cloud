#!/bin/bash
# VM startup script — runs as root on first boot of the Compute Engine VM.
# Installs Docker + docker compose plugin on Debian 12.
set -euo pipefail

apt-get update
apt-get install -y ca-certificates curl gnupg git

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow the default login user to use docker without sudo
# On GCE VMs the SSH login user is created on first login; we add a placeholder group rule
groupadd -f docker

systemctl enable docker
systemctl start docker

mkdir -p /opt/app
chmod 755 /opt/app

echo "[$(date -Iseconds)] startup script complete" >> /var/log/vm-startup.log
