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
    console.error('ERROR: Failed to create registry with error: `%s`.', error);
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
    console.error('ERROR: Failed to deploy registry with error: `%s`.', error);
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
// Registry Getters...
////////////////////////////////////////////////////////////////////////////////

// Gets the upload URL for the provider with `address`.
//
// Returns a promise to a call to registry's `getProviderUrl` method.
async function getProviderUrl(address, abi = undefined) {
  if (abi === undefined) {
    abi = await readRegistryABI();
  }

  const config = zxeth.getConf();

  let registry = null;
  try {
    registry = new web3.eth.Contract(abi, config.registry);

  } catch(error) {
    console.error('ERROR: Failed to create registry with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    return registry.methods.getProviderUrl(address).call();
  } catch(error) {
    console.error(
      'ERROR: Failed to call `getProviderUrl()` with error: `%s`.',
      error
    );
    return Promise.reject(error);
  }
}

// Gets the challenge URL for the provider with `address`.
//
// Returns a promise to a call to registry's `getChallengeUrl` method.
async function getChallengeUrl(address, abi = undefined) {
  if (abi === undefined) {
    abi = await readRegistryABI();
  }

  const config = zxeth.getConf();

  let registry = null;
  try {
    registry = new web3.eth.Contract(abi, config.registry);

  } catch(error) {
    console.error('ERROR: Failed to create registry with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    return registry.methods.getChallengeUrl(address).call();
  } catch(error) {
    console.error(
      'ERROR: Failed to call `getProviderUrl()` with error: `%s`.',
      error
    );
    return Promise.reject(error);
  }
}

// Gets the upload URL for all the providers registered.
//
// Returns a promise to all the calls required to get the provider URLs.
async function getRegistry(abi = undefined) {
  if (abi === undefined) {
    abi = await readRegistryABI();
  }

  const config = zxeth.getConf();

  let registry = null;
  try {
    registry = new web3.eth.Contract(abi, config.registry);

  } catch(error) {
    console.error('ERROR: Failed to create registry with error: `%s`.', error);
    return Promise.reject(error);
  }

  let providerUrlsSize = null;
  try {
    providerUrlsSize = await registry.methods.getProviderUrlsSize().call();
  } catch(error) {
    console.error(
      'ERROR: Failed to call `getProviderUrlsSize()` with error: `%s`.',
      error
    );
    return Promise.reject(error);
  }

  let challengeUrlsSize = null;
  try {
    challengeUrlsSize = await registry.methods.getChallengeUrlsSize().call();
  } catch(error) {
    console.error(
      'ERROR: Failed to call `getChallengeUrlsSize()` with error: `%s`.',
      error
    );
    return Promise.reject(error);
  }

  if (providerUrlsSize !== challengeUrlsSize) {
    console.error('ERROR: Mismatching registry entries.');
  }

  let registryPromises = [];
  for (let i = 0; i < providerUrlsSize; i++) {
    registryPromises.push(
      registry.methods.getProviderAddressByIndex(i).call()
    );
    registryPromises.push(
      registry.methods.getProviderUrlByIndex(i).call()
    );
    registryPromises.push(
      registry.methods.getChallengeAddressByIndex(i).call()
    );
    registryPromises.push(
      registry.methods.getChallengeUrlByIndex(i).call()
    );
  }

  const registryPromise = Promise
    .all(registryPromises)
    .then((values) => {
      let registry = [];

      for (let i = 0; i < values.length; i += 4) {
        if (values[0] !== values[2]) {
          console.error('ERROR: Mismatching registry entries.');
          continue;
        }

        registry.push({
          address: values[i],
          endpoint: values[i + 1],
          challenge: values[i + 3],
        });
      }

      return Promise.resolve(registry);
    })
    .catch((error) => {
      console.error(
        'ERROR: Failed to get provider URLs with error: `%s`.', error
      );
      return Promise.reject(error);
    });

  return registryPromise;
}

////////////////////////////////////////////////////////////////////////////////
// Registry Setters...
////////////////////////////////////////////////////////////////////////////////

// Sets the upload URL for the default account (This user acts as
// a provider).
//
// Returns a promise to a call to registry's `setProviderUrl` method.
async function setProviderUrl(url, abi = undefined) {
  if (abi === undefined) {
    abi = await readRegistryABI();
  }

  const config = zxeth.getConf();

  let registry = null;
  try {
    registry = new web3.eth.Contract(abi, config.registry);
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
    return registry
      .methods
      .setProviderUrl(url)
      .send({
        'from': Wallet.getAccount(),
        'gas': 5200000,
      });
  } catch(error) {
    console.error('ERROR: Failed to call `update()` with error: `%s`.', error);
    return Promise.reject(error);
  }
}


// Sets the challenge URL for the default account (This user acts as
// a provider).
//
// Returns a promise to a call to registry's `setChallengeUrl` method.
async function setChallengeUrl(url, abi = undefined) {
  if (abi === undefined) {
    abi = await readRegistryABI();
  }

  const config = zxeth.getConf();

  let registry = null;
  try {
    registry = new web3.eth.Contract(abi, config.registry);
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
    return registry
      .methods
      .setChallengeUrl(url)
      .send({
        'from': Wallet.getAccount(),
        'gas': 5200000,
      });
  } catch(error) {
    console.error('ERROR: Failed to call `update()` with error: `%s`.', error);
    return Promise.reject(error);
  }
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
      fs.readFileSync(zxconf.CLOUDAGORA_REGISTRY_ABI, 'utf8')
    );

    return Promise.resolve(abi);
  } catch(error) {
    console.error(
      'ERROR: Failed to read registry ABI with error: `%s`.', error
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
      zxconf.CLOUDAGORA_REGISTRY_BIN, 'utf8'
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
  getProviderUrl: getProviderUrl,
  getChallengeUrl: getChallengeUrl,
  setChallengeUrl: setChallengeUrl,
  getRegistry: getRegistry,
  setProviderUrl: setProviderUrl,
};
