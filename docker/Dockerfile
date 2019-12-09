# Setup a intermediate builder container.
FROM golang:1.11-alpine as builder

RUN \
    # 0. Update/Upgrade system and install dependencies.
    apk update && apk add build-base linux-headers curl; \
    \
    # 1. Create ethereum directory in GOPATH.
    mkdir -p $GOPATH/src/github.com/ethereum/go-ethereum; \
    \
    # 2. Download ethereum v1.8.17 source code and move into GOPATH.
    curl -L https://github.com/ethereum/go-ethereum/archive/v1.8.17.tar.gz | \
    tar -xz --strip 1 -C $GOPATH/src/github.com/ethereum/go-ethereum; \
    \
    # 3. Build/Install ethereum from source.
    cd $GOPATH/src/github.com/ethereum/go-ethereum; \
    go build ./... && go install ./... && go clean -cache

# Setup the actual ethereum node container.
FROM alpine:latest

# 0. Copy binaries from builder.
COPY --from=builder /go/bin/* /usr/local/bin/

# 1. Setup ethereum data directory.
RUN mkdir -p /opt/ethereum /opt-ethereum/keystore-data

# 2. Add ethereum init files.
ADD ./bootstrap/control.sh ./bootstrap/genesis.json /opt/ethereum/

ADD ./bootstrap/keystore /opt/ethereum/keystore-data/

# 3. Run an ethereum node.
WORKDIR /opt/ethereum/

ENTRYPOINT [ "/opt/ethereum/control.sh" ]

CMD [ ]
