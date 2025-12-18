This directory contains a tiny smoke Docker image used for validating ECR push and ECS deployment flows.

Files:
- `Dockerfile` - minimal image that prints a short message.
- `smoke-entry.sh` - entrypoint script used by the image.

The GitHub Actions smoke workflow builds and pushes this image to the ECR repo specified in the workflow inputs; it is not intended to be deployed for production.
