#!/bin/sh
# Inject runtime environment variables into the static frontend

set -e

if [ -z "$REACT_APP_API_URL" ]; then
  REACT_APP_API_URL="/api/v1"
fi

echo "window.__ENV__ = { REACT_APP_API_URL: '$REACT_APP_API_URL' };" > /usr/share/nginx/html/env-config.js

exit 0
