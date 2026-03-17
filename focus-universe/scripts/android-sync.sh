#!/usr/bin/env sh

set -eu

npm run build
npx cap sync android

echo "Android project synced. Open with:"
echo "  npx cap open android"
