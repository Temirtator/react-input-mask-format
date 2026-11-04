#!/usr/bin/env bash
set -euo pipefail
common=(--noEmit --strict --jsx react-jsx --lib es2019,dom types.tsx)
npx tsc "${common[@]}" --moduleResolution bundler --module esnext
npx tsc "${common[@]}" --moduleResolution node16 --module node16
npx tsc "${common[@]}" --moduleResolution node --module commonjs --esModuleInterop
npx tsc "${common[@]}" --moduleResolution node --module commonjs --esModuleInterop false --allowSyntheticDefaultImports false
echo "types ok"
