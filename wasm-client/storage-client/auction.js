'use strict';

const fs = require('fs');

const zxeth = require('./zxeth.js');
const zxconf = require('./zxconf.js');

const Wallet = require('./wallet.js');

const web3 = zxeth.getWeb3();


////////////////////////////////////////////////////////////////////////////////
// Auction Factory Actions...
////////////////////////////////////////////////////////////////////////////////

// Bids to the auction at `address` with `amount`.
async function bid(address, amount, abi = undefined) {
  if (abi === undefined) {
    abi = await readAuctionABI();
  }

  let auction = null;
  try {
    auction = new web3.eth.Contract(abi, address);
  } catch(error) {
    console.error(
      'ERROR: Failed to create auction factory with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  try {
    await Wallet.unlockAccount();
  } catch(error) {
    console.error('ERROR: Failed to unlock account with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    const bidPromise = auction
      .methods
      .placeOffer(amount)
      .send({
        from: Wallet.getAccount(),
        gas: 5200000,
      });

    return bidPromise;
  } catch(error) {
    console.error(
      'ERROR: Failed to call `placeOffer()` with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}

// Finalizes the auction at `address`.
async function finalize(address, amount, abi = undefined) {
  if (abi === undefined) {
    abi = await readAuctionABI();
  }

  let auction = null;
  try {
    auction = new web3.eth.Contract(abi, address);
  } catch(error) {
    console.error(
      'ERROR: Failed to create auction factory with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  try {
    await Wallet.unlockAccount();
  } catch(error) {
    console.error('ERROR: Failed to unlock account with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    const finalizePromise = auction
      .methods
      .finalize()
      .send({
        from: Wallet.getAccount(),
        gas: 5200000,
        value: amount,
      });

    return finalizePromise;
  } catch(error) {
    console.error(
      'ERROR: Failed to call `finalize()` with error: `%s`.', error
    );
    return Promise.reject(error);
  }

}

////////////////////////////////////////////////////////////////////////////////
// Auction Getters...
////////////////////////////////////////////////////////////////////////////////

async function getAuction(address, abi = undefined) {
  if (abi === undefined) {
    abi = await readAuctionABI();
  }

  let auction = null;
  try {
    auction = new web3.eth.Contract(abi, address);
  } catch(error) {
    console.error(
      'ERROR: Failed to create auction factory with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  const auctionGetterPromises = [
    auction.methods.taskID().call(),
    auction.methods.owner().call(),
    auction.methods.computeTask().call(),
    auction.methods.startTime().call(),
    auction.methods.auctionDeadline().call(),
    auction.methods.duration().call(),
    auction.methods.agoraContract().call(),
    auction.methods.canceled().call(),
    auction.methods.finalized().call(),
    auction.methods.lowestOffer().call(),
    auction.methods.winningBidder().call(),
  ];

  const auctionPromise = Promise
    .all(auctionGetterPromises)
    .then((values) => {
      try {
        const auctionInfo = {
          address: address,
          taskId: values[0],
          owner: values[1],
          isCompute: values[2],
          startTime: parseInt(values[3]),
          endTime: parseInt(values[4]),
          duration: parseInt(values[5]),
          contract: values[6],
          canceled: values[7],
          finalized: values[8],
          lowestOffer: parseInt(values[9]),
          winner: values[10],
        };

        if (parseInt(auctionInfo.contract) == 0) {
          auctionInfo.contract = '';
        }
        if (parseInt(auctionInfo.winner) == 0) {
          auctionInfo.winner = '';
        }

        return Promise.resolve(auctionInfo);
      } catch(error) {
        console.error(
          'ERROR: Failed to parse auction with error: `%s`.', error
        );
        return Promise.reject(error);
      }
    });

  return auctionPromise;
}


////////////////////////////////////////////////////////////////////////////////
// Helper Functions...
////////////////////////////////////////////////////////////////////////////////

// Reads the auction's ABI.
//
// The location is specified in the agent's config.
async function readAuctionABI() {
  try {
    const abi = JSON.parse(
      fs.readFileSync(zxconf.CLOUDAGORA_AUCTION_ABI, 'utf8')
    );


    return Promise.resolve(abi);

  } catch(error) {
    console.error(
      'ERROR: Failed to read registry ABI with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}

module.exports = {
  bid: bid,
  finalize: finalize,
  getAuction: getAuction,
};

