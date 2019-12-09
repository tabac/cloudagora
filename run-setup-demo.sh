#!/bin/bash

mkdir -p uploads/{client,provider}

./zxcli \
    --config wasm-client/storage-client/zxconf-client.json \
    resetdb

./zxcli \
    --config wasm-client/storage-client/zxconf-provider.json \
    resetdb

./zxcli \
    --config wasm-client/storage-client/zxconf-provider.json \
    register \
    http://127.0.0.1:9999/uploads \
    http://127.0.0.1:9999/prove
