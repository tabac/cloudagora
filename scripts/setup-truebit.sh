#!/bin/bash

# Assume that we run this script from within the truebit top level directory
# we also assume that we use the meter_fix branch of truebit_os 

npm i --production
npm run deps
npm run compile
rm -rf ~/.opam
