#!/bin/bash
# Instance-template startup script. Reads its settings from instance metadata:
#   app-image  = full Artifact Registry image path
#   app-cport  = port the container listens on (80 for web, 3000 for services)
#   app-env    = extra docker args, e.g. -e DATABASE_URL=postgres://...
MD=http://metadata.google.internal/computeMetadata/v1
get(){ curl -s -H "Metadata-Flavor: Google" $MD/instance/attributes/$1; }
IMAGE=$(get app-image); CPORT=$(get app-cport); ENVS=$(get app-env)
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh
TOKEN=$(curl -s -H "Metadata-Flavor: Google" $MD/instance/service-accounts/default/token | sed 's/.*"access_token":"\([^"]*\)".*/\1/')
echo "$TOKEN" | docker login -u oauth2accesstoken --password-stdin https://us-central1-docker.pkg.dev
docker rm -f app 2>/dev/null
docker run -d --name app --restart always -p 80:$CPORT -e VM_NAME=$(hostname) $ENVS $IMAGE
