#!/usr/bin/env sh
set -eu

IMAGE_TAG="registry.fanjango.com.hk/vib3cod3r/lamma-robin:latest"

sudo docker build -t "$IMAGE_TAG" .
sudo docker push "$IMAGE_TAG"
