#!/bin/sh
set -e

# Ensure the avatars directory is writable by nextjs user
# The directory is a Docker volume, so we just need to make it writable
if [ -d "/app/public/uploads/avatars" ]; then
  chmod 777 /app/public/uploads/avatars 2>/dev/null || true
fi

# Switch to nextjs user and execute the main command
exec runuser -u nextjs -- "$@"
