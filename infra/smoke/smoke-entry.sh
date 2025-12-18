#!/bin/sh
set -e

# Minimal container entrypoint for the smoke image - prints a message and sleeps for a short time
echo "smoke image starting: $(date)"
sleep 1
echo "smoke image done"
