'use strict';

const fs = require('fs');

const zxeth = require('./zxeth.js');
const zxconf = require('./zxconf.js');

const Wallet = require('./wallet.js');

const web3 = zxeth.getWeb3();


////////////////////////////////////////////////////////////////////////////////
// Registry Actions...
////////////////////////////////////////////////////////////////////////////////

// Deploys the registry using funds from `address`.
//
// Returns a promise to the deploy transaction.
async function deploy(abi = undefined, bytecode = undefined) {
  if (abi === undefined) {
    abi = await readRegistryABI();
  }

  if (bytecode === undefined) {
    bytecode = await readRegistryBIN();
  }

  let registry = null;
  try {
    registry = new web3.eth.Contract(abi);
  } catch(error) {
    console.error(
      'ERROR: Failed to create contracts registry with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  try {
    await Wallet.unlockAccount();
  } catch(error) {
    console.error('ERROR: Failed to unlock account with error: `%s`.', error);
    return Promise.reject(error);
  }

  const transactionPromise = registry.deploy({
    'data': bytecode,
  }).send({
    'from': Wallet.getAccount(),
    'gas': 5200000,
  }).on('error', (error) => {
    console.error(
      'ERROR: Failed to deploy contracts registry with error: `%s`.', error
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

////////////////////////////////////////////////////////////////////////////////
// Helper Functions...
////////////////////////////////////////////////////////////////////////////////

// Reads the registry's ABI.
//
// The location is specified in the agent's config.
async function readRegistryABI() {
  try {
    const abi = JSON.parse(
      fs.readFileSync(zxconf.CLOUDAGORA_CONTRACTSREGISTRY_ABI, 'utf8')
    );

    return Promise.resolve(abi);
  } catch(error) {
    console.error(
      'ERROR: Failed to read contracts registry ABI with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}

// Reads the registry's BIN.
//
// The location is specified in the agent's config.
async function readRegistryBIN() {
  try {
    const bytecode = '0x' + fs.readFileSync(
      zxconf.CLOUDAGORA_CONTRACTSREGISTRY_BIN, 'utf8'
    );

    return Promise.resolve(bytecode);
  } catch(error) {
    console.error(
      'ERROR: Failed to read contracts registry BIN with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}

module.exports = {
  deploy: deploy,
};
