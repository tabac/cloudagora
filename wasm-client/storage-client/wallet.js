'use strict';

const zxeth = require('./zxeth.js');
const zxconf = require('./zxconf.js');

const web3 = zxeth.getWeb3();

// Unlocks the first account of the `configuration`.
//
// Returns a promise to a call to `unlockAccount`.
async function unlockAccount(address = undefined, password = undefined) {
  if (address === undefined || password === undefined) {
    const config = zxeth.getConf();

    address = config.accounts[0];
    password = config.passwords[0];
  }

  return web3.eth.personal.unlockAccount(
    address, password, zxconf.UNLOCK_ACCOUNT_PERIOD
  );
}

// Returns the default user account based on the `configuration`.
function getAccount() {
  const config = zxeth.getConf();

  return config.accounts[0];
}

// Returns the balance of the default user account based on the
// `configuration`.
async function getAccountBalance() {
  return web3.eth.getBalance(getAccount());
}

module.exports = {
  getAccount: getAccount,
  getAccountBalance: getAccountBalance,
  unlockAccount: unlockAccount,
};
