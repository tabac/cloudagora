#!/bin/ash


BOOTNODE_KEY="$PWD/bootnode.key"

ETH_DATADIR="$PWD/chain-data"
ETH_KEYSTORE_SRC_DIR="$PWD/keystore-data"
ETH_KEYSTORE_DST_DIR="$ETH_DATADIR/keystore"

ETH_MAXPEERS=13
ETH_RPCADDR="0.0.0.0"
ETH_RPCPORT=8098
ETH_RPCAPI="db,eth,net,web3,personal"
ETH_RPCCORS="*"
ETH_PORT=30033
ETH_IDENTITY="$(hostname)"
ETH_NETWORKID=79766

GETH_ARGS="\
    --rpc \
    --miner.threads 1 \
    --datadir $ETH_DATADIR \
    --maxpeers $ETH_MAXPEERS \
    --rpcaddr $ETH_RPCADDR \
    --rpcport $ETH_RPCPORT \
    --rpcapi $ETH_RPCAPI \
    --rpccorsdomain \"$ETH_RPCCORS\" \
    --port $ETH_PORT \
    --identity $ETH_IDENTITY \
    --networkid $ETH_NETWORKID
"

# We don't use this although recommended in 
# order to have peers auto-discover themselves.
# --nodiscover \


# Initialize node if not yet initialized.

if [ ! -d $ETH_DATADIR ]
then
    echo "Initializing node ..."

    geth $GETH_ARGS init "$PWD/genesis.json"

    cp $ETH_KEYSTORE_SRC_DIR/* $ETH_KEYSTORE_DST_DIR
fi


# Run ethereum node/bootnode.

if [ "$1" == "run" ]
then
    # Run a bootnode in this container.
    if [ "$2" == "bootnode" ]
    then
        # Create bootnode key.
        bootnode --genkey=$BOOTNODE_KEY

        # Start bootnode.
        bootnode --nodekey=$BOOTNODE_KEY
    fi

    if [ "$2" == "node" ]
    then
        echo "Running node geth client ..."

        ACCOUNT_LINE_NUMBER=$(($4 + 1))

        NODE_COINBASE="$(
            geth $GETH_ARGS account list | 
            sed -n -e "$ACCOUNT_LINE_NUMBER"p | 
            sed 's/^.*{//' | sed 's/}.*$//'
        )"

        if [ $# -ge 3 ]
        then
            geth \
                $GETH_ARGS \
                --miner.etherbase $NODE_COINBASE \
                --bootnodes "$3" 
        else
            geth \
                $GETH_ARGS
                --miner.etherbase $NODE_COINBASE
        fi
    fi
fi


# Just for debugging.

if [ "$1" == "debug" ]
then
    # Sleep for 1 day...
    sleep 1d
fi
