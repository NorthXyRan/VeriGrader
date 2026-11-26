#!/usr/bin/env bash
# Build the GitHub Pages bundle: project page at the root, demo app under demo/.
# Output: site/dist (publish its contents to the root of the gh-pages branch).
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
node "$root/scripts/build-site.mjs"
cd "$root/frontend"
npm run type-check
npm run build-only -- --mode pages --base /VeriGrader/demo/ --outDir "$root/site/dist/demo" --emptyOutDir
echo "Pages bundle ready in site/dist"
