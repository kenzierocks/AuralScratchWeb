#!/usr/bin/env bash

script_dir="$(dirname "$(python -c 'print(__import__("os").path.realpath("'"$0"'"))')")"
cd "$script_dir"

set -ex

rm -rf ts-bin/*

if [[ "${ENVIRONMENT}" == "DEV" ]]; then
    npm run dev &
    cd dist
    ../node_modules/.bin/live-server --port=8000 --no-browser
else
    npm run build
fi
