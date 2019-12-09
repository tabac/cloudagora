'use strict';

const fs = require('fs');

const zxeth = require('./zxeth.js');
const zxconf = require('./zxconf.js');

const Wallet = require('./wallet.js');

const web3 = zxeth.getWeb3();


////////////////////////////////////////////////////////////////////////////////
// Auction Factory Actions...
////////////////////////////////////////////////////////////////////////////////

// Deploys the AuctionFactory contract.
async function deploy(address, abi = undefined, bytecode = undefined) {
  if (abi === undefined) {
    abi = await readAuctionFactoryABI();
  }

  if (bytecode === undefined) {
    bytecode = await readAuctionFactoryBIN();
  }

  let auctionFactory = null;
  try {
    auctionFactory = new web3.eth.Contract(abi);
  } catch(error) {
    console.error('ERROR: Failed to create registry with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    await Wallet.unlockAccount();
  } catch(error) {
    console.error('ERROR: Failed to unlock account with error: `%s`.', error);
    return Promise.reject(error);
  }

  const transactionPromise = auctionFactory.deploy({
    'data': bytecode,
    'arguments': [address],
  }).send({
    'from': Wallet.getAccount(),
    'gas': 5200000,
  }).on('error', (error) => {
    console.error(
      'ERROR: Failed to deploy auction factory with error: `%s`.', error
    );
  }).on('transactionHash', (transactionHash) => {
    console.log('INFO: Received transaction hash: ' + transactionHash + '.');
  }).on('receipt', () => {
    console.log('INFO: Received transaction receipt!');
  }).on('confirmation', (confirmationNumber) => {
    console.log(
      'INFO: Received confirmation number: `%s`.',
      confirmationNumber
    );
  });

  return transactionPromise;
}

// Creates a new Storage Auction using the AuctionFactory at `address`.
async function newStorageAuction(
  address,
  taskId,
  duration,
  filesize,
  abi = undefined
) {
  if (abi === undefined) {
    abi = await readAuctionFactoryABI();
  }

  let auctionFactory = null;
  try {
    auctionFactory = new web3.eth.Contract(abi, address);
  } catch(error) {
    console.error('ERROR: Failed to create registry with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    await Wallet.unlockAccount();
  } catch(error) {
    console.error('ERROR: Failed to unlock account with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    const newAuctionPromise = auctionFactory
      .methods
      .createStorageAuction(
        taskId,
        duration,
        filesize
      ).send({
        from: Wallet.getAccount(),
        gas: 5200000,
      });

    return newAuctionPromise;
  } catch(error) {
    console.error(
      'ERROR: Failed to call `createStorageAuction()` with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}

// Creates a new Compute Auction using the AuctionFactory at `address`.
async function newComputeAuction(
  address,
  taskId,
  duration,
  gas,
  abi = undefined
) {
  if (abi === undefined) {
    abi = await readAuctionFactoryABI();
  }

  let auctionFactory = null;
  try {
    auctionFactory = new web3.eth.Contract(abi, address);
  } catch(error) {
    console.error('ERROR: Failed to create registry with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    await Wallet.unlockAccount();
  } catch(error) {
    console.error('ERROR: Failed to unlock account with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    const newAuctionPromise = auctionFactory
      .methods
      .createComputeAuction(
        taskId,
        duration,
        gas 
      ).send({
        from: Wallet.getAccount(),
        gas: 5200000,
      });

    return newAuctionPromise;
  } catch(error) {
    console.error(
      'ERROR: Failed to call `createStorageAuction()` with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}
////////////////////////////////////////////////////////////////////////////////
// Auction Factory Getters...
////////////////////////////////////////////////////////////////////////////////

async function getStorageAuctions(address, abi = undefined) {
  if (abi === undefined) {
    abi = await readAuctionFactoryABI();
  }

  let auctionFactory = null;
  try {
    auctionFactory = new web3.eth.Contract(abi, address);
  } catch(error) {
    console.error(
      'ERROR: Failed to create auction factory with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  const storageAuctionsSize = await auctionFactory
    .methods
    .getStorageAuctionsSize()
    .call();

  let storageAuctionPromises = [];
  for (let i = 0; i < storageAuctionsSize; i++) {
    storageAuctionPromises.push(
      auctionFactory.methods.getStorageAuctionByIndex(i).call()
    );
  }

  return Promise.all(storageAuctionPromises);
}

async function getComputeAuctions(address, abi = undefined) {
  if (abi === undefined) {
    abi = await readAuctionFactoryABI();
  }

  let auctionFactory = null;
  try {
    auctionFactory = new web3.eth.Contract(abi, address);
  } catch(error) {
    console.error(
      'ERROR: Failed to create auction factory with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  const computeAuctionsSize = await auctionFactory 
    .methods
    .getComputeAuctionsSize()
    .call();

  let computeAuctionPromises = [];
  for (let i = 0; i < computeAuctionsSize; i++) {
    computeAuctionPromises.push(
      auctionFactory.methods.getComputeAuctionByIndex(i).call()
    );
  }

  return Promise.all(computeAuctionPromises);
}

////////////////////////////////////////////////////////////////////////////////
// Helper Functions...
////////////////////////////////////////////////////////////////////////////////

// Reads the auction factory's ABI.
//
// The location is specified in the agent's config.
async function readAuctionFactoryABI() {
  try {
    const abi = JSON.parse(
      fs.readFileSync(zxconf.CLOUDAGORA_AUCTIONFACTORY_ABI, 'utf8')
    );


    return Promise.resolve(abi);

  } catch(error) {
    console.error(
      'ERROR: Failed to read registry ABI with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}

// Reads the auction factory's BIN.
//
// The location is specified in the agent's config.
async function readAuctionFactoryBIN() {
  try {
    const bytecode = '0x' + fs.readFileSync(
      zxconf.CLOUDAGORA_AUCTIONFACTORY_BIN, 'utf8'
    );

    return Promise.resolve(bytecode);
  } catch(error) {
    console.error(
      'ERROR: Failed to read registry BIN with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}

module.exports = {
  deploy: deploy,
  newStorageAuction: newStorageAuction,
  getStorageAuctions: getStorageAuctions,
  newComputeAuction: newComputeAuction,
  getComputeAuctions: getComputeAuctions,
};

