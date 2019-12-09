#!/bin/bash

./rest/rest-api.js \
    --config ./wasm-client/storage-client/zxconf-client.json \
    --host 0.0.0.0 \
    --port 9870 \
    daemon
