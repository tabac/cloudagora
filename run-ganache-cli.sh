#!/bin/bash

ganache-cli \
    --defaultBalanceEther 1000 \
    --port 7545 \
    --host 0.0.0.0 \
    --deterministic
