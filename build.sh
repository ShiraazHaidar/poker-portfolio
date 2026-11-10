#!/usr/bin/env bash
# Builds the folder Cloudflare Pages publishes (dist/).
# If a file named SITE_CLOSED exists in the repo, only the "Back soon" page is published.
set -euo pipefail
rm -rf dist && mkdir dist
if [ -f SITE_CLOSED ]; then
  cp back-soon/index.html back-soon/favicon.svg dist/
else
  cp -R index.html styles.css main.js content.js animations.js calculator.js _headers assets poker dist/
fi
