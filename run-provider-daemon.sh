#!/bin/bash

./rest/rest-api.js \
    --config ./wasm-client/storage-client/zxconf-provider.json \
    --host 0.0.0.0 \
    --port 9999 \
    daemon
