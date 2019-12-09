'use strict';

const fs = require('fs');
const zxconf = require('./zxconf.js');
const zxeth = require('./zxeth.js');

function getDbName() {
  const config = zxeth.getConf();

  return config.db !== undefined ? config.db : zxconf.AGENT_DB;
}

function loadDb() {
  return JSON.parse(fs.readFileSync(getDbName(), 'utf8'));
}

function resetDb() {
  const schema = {
    'storageContracts': {
      'client': {},
      'provider': {},
    },
    'storageAuctionContracts': {},
    'computeAuctionContracts': {},
    'computeContracts': {
      'client': {},
      'provider': {},
    }
  };

  fs.writeFileSync(getDbName(), JSON.stringify(schema));
}

function getStorageContracts() {
  let db = loadDb();

  return db.storageContracts;
}

function getComputeContracts() {
  let db = loadDb();

  return db.computeContracts;
}

function getStorageAuctions() {
  let db = loadDb();

  return db.storageAuctionContracts;
}

function getComputeAuctions() {
  let db = loadDb();

  return db.computeAuctionContracts;
}

function saveClientStorageContract(contract) {
  let db = loadDb();

  contract.role = 'client';

  db.storageContracts.client[contract.address] = contract;

  fs.writeFileSync(getDbName(), JSON.stringify(db));
}

function saveProviderStorageContract(contract) {
  let db = loadDb();

  contract.role = 'provider';

  db.storageContracts.provider[contract.address] = contract;

  fs.writeFileSync(getDbName(), JSON.stringify(db));
}

function saveStorageAuctionContract(contract) {
  let db = loadDb();

  db.storageAuctionContracts[contract.address] = contract;

  fs.writeFileSync(getDbName(), JSON.stringify(db));
}

function saveComputeAuctionContract(contract) {
  let db = loadDb();

  db.computeAuctionContracts[contract.address] = contract;

  fs.writeFileSync(getDbName(), JSON.stringify(db));
}

function saveClientComputeContract(contract) {
  let db = loadDb();

  contract.role = 'client';

  db.computeContracts.client[contract.address] = contract;

  fs.writeFileSync(getDbName(), JSON.stringify(db));
}

function saveProviderComputeContract(contract) {
  let db = loadDb();

  contract.role = 'provider';

  db.computeContracts.provider[contract.address] = contract;

  fs.writeFileSync(getDbName(), JSON.stringify(db));
}

module.exports = {
  loadDb: loadDb,
  resetDb: resetDb,
  getStorageAuctions: getStorageAuctions,
  getComputeAuctions: getComputeAuctions,
  getStorageContracts: getStorageContracts,
  getComputeContracts: getComputeContracts,
  saveClientStorageContract: saveClientStorageContract,
  saveProviderStorageContract: saveProviderStorageContract,
  saveStorageAuctionContract: saveStorageAuctionContract,
  saveComputeAuctionContract: saveComputeAuctionContract,
  saveClientComputeContract: saveClientComputeContract,
  saveProviderComputeContract: saveProviderComputeContract,
};
