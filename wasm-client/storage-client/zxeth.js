'use strict';

const Web3 = require('web3');

const zxutils = require('./zxutils.js');


const web3 = new Web3();

var config = { };

// Verifies that the `configuration` matches the blockchain state.
//
// Connects to an ethereum node at the URL stored in the
// `config` and checks if *some* of the account(s) exist in the
// blockchain.
async function validate() {
  web3.setProvider(new web3.providers.HttpProvider(config.url));

  let accounts = null;
  try {
    accounts = await web3.eth.getAccounts();
  } catch(error) {
    console.error('ERROR: Failed to get accounts with error: `%s`.', error);
    return Promise.reject(error);
  }

  accounts = accounts.map(x => x.toLowerCase());

  if ('accounts' in config && config.accounts !== undefined) {
    config.accounts = config.accounts.map(x => x.toLowerCase());

    const accountExists = config.accounts.some(
      (item) => (accounts.indexOf(item) != -1)
    );

    if (!accountExists) {
      console.error('ERROR: No configuration account exists.');
      return Promise.reject(
        new Error('ERROR: No configuration account exists.')
      );
    }
  } else {
    console.error('ERROR: Configuration contains no accounts.');
    return Promise.reject(
      new Error('ERROR: Configuration contains no accounts.')
    );
  }

  return Promise.resolve();
}

// Returns a reference to the local `config` variable.
function getConf() {
  return config;
}

// Sets the `config` local variable to a copy of `configuration`.
function setConf(configuration) {
  config = zxutils.copy(configuration);
}

// Returns the initialized web3 object.
function getWeb3() {
  return web3;
}

module.exports = {
  getWeb3: getWeb3,
  getConf: getConf,
  setConf: setConf,
  validate: validate,
};
