'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
// const keccak = require('keccak');
const rp = require('request-promise-native');

const zxdb = require('./zxdb.js');
const zxeth = require('./zxeth.js');
const zxconf = require('./zxconf.js');
const zxutils = require('./zxutils.js');
const zxmerkle = require('./zxmerkle.js');

const Wallet = require('./wallet.js');
const Auction = require('./auction.js');
const AuctionFactory = require('./auction-factory.js');
const UsersRegistry = require('./users-registry.js');
const ContractsRegistry = require('./contracts-registry.js');
const StorageContract = require('./storage-contract.js');
const ComputeContract = require('./compute-contract.js');

var files = { };

////////////////////////////////////////////////////////////////////////////////
// Auction Factory actions...
////////////////////////////////////////////////////////////////////////////////

// Creates a new Storage Auction through the AuctionFactory.
async function newStorageAuction(filesize, duration) {
  const config = zxeth.getConf();

  const address = config.auctionFactory;

  const taskId = new Buffer.alloc(32);

  try {
    const auction = await AuctionFactory.newStorageAuction(
      address,
      taskId,
      duration,
      filesize
    );

    // zxdb.saveStorageAuctionContract({ address: auction, });

    return Promise.resolve(auction);
  } catch(error) {
    console.error(
      'ERROR: Failed to create Storage Auction with error: `%s`.', error
    );
    Promise.reject(error);
  }
}

// Returns all available Storage Auctions.
async function getStorageAuctions() {
  const config = zxeth.getConf();

  const address = config.auctionFactory;

  const auctions = await AuctionFactory.getStorageAuctions(address);

  return Promise.resolve(auctions);
}


// Creates a new Compute Auction through the AuctionFactory.
async function newComputeAuction(gas, duration) {
  const config = zxeth.getConf();

  const address = config.auctionFactory;

  const taskId = new Buffer.alloc(32);

  try {
    const auction = await AuctionFactory.newComputeAuction(
      address,
      taskId,
      duration,
      gas
    );

    // zxdb.saveStorageAuctionContract({ address: auction, });

    return Promise.resolve(auction);
  } catch(error) {
    console.error(
      'ERROR: Failed to create Storage Auction with error: `%s`.', error
    );
    Promise.reject(error);
  }
}

// Returns all available Compute Auctions.
async function getComputeAuctions() {
  const config = zxeth.getConf();

  const address = config.auctionFactory;

  const auctions = await AuctionFactory.getComputeAuctions(address);

  return Promise.resolve(auctions);
}

////////////////////////////////////////////////////////////////////////////////
// Auction actions...
////////////////////////////////////////////////////////////////////////////////

// Returns information on a specific Auction.
async function getAuction(address) {
  return Auction.getAuction(address);
}

// Bids to the auction with the `amount`.
async function bidToAuction(address, amount) {
  return Auction.bid(address, amount);
}

// Finalizes the auction at `address`.
async function finalizeAuction(address, filename = undefined) {
  let auction = null;
  try {
    auction = await getAuction(address);
  } catch(error) {
    console.error('ERROR: Failed to get auction with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    await Auction.finalize(address, auction.lowestOffer);
  } catch(error) {
    console.error(
      'ERROR: Failed to finalize the auction with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  try {
    auction = await getAuction(address);
  } catch(error) {
    console.error('ERROR: Failed to get auction with error: `%s`.', error);
    return Promise.reject(error);
  }

  if (auction.isCompute) {
    // Compute specific logic.
    zxdb.saveClientComputeContract({
      address: auction.contract,
      gas: 1000, //FIXME
      createDate: Date.now(),
    });
  } else {
    const stats = fs.statSync(filename);

    const merkleResult = await zxmerkle.create(filename);

    const fileHash = merkleResult.tree.getRoot();

    try {
      await StorageContract.setFileHash(auction.contract, fileHash);
    } catch(error) {
      console.error('ERROR: Failed to set fileHash with error: `%s`.', error);
      return Promise.reject(error);
    }

    zxdb.saveClientStorageContract({
      address: auction.contract,
      filename: filename,
      filesize: stats.size,
      createDate: Date.now(),
    });
  }

  return Promise.resolve(auction);
}

////////////////////////////////////////////////////////////////////////////////
// Storage Contract actions...
////////////////////////////////////////////////////////////////////////////////

// Deploys a new storage contract.
async function create(address, filename, payment, guarantee, duration) {
  console.log('INFO: Deploying contract.');

  const merkleResult = await zxmerkle.create(filename);

  const rootHash = merkleResult.tree.getRoot();

  const config = zxeth.getConf();

  const taskId = new Buffer.alloc(32);

  try {
    const contract = await StorageContract.deploy(
      taskId,
      address,
      rootHash,
      payment,
      guarantee,
      duration,
      config.contractsRegistry
    );

    const stats = fs.statSync(filename);

    zxdb.saveClientStorageContract({
      'address': contract.options.address,
      'filename': filename,
      'filesize': stats.size,
      'createDate': Date.now(),
    });

    return Promise.resolve(contract);
  } catch(error) {
    console.error('ERROR: Failed to deploy contract: `%s`.', error);
    return Promise.reject(error);
  }
}


// Deploys a new compute contract.
async function compcreate(address, payment, guarantee, duration) {
  console.log('INFO: Deploying contract.');

  const config = zxeth.getConf();

  const taskId = new Buffer.alloc(32);

  try {
    const contract = await ComputeContract.deploy(
      taskId,
      address,
      payment,
      guarantee,
      duration,
      config.contractsRegistry
    );

    zxdb.saveClientComputeContract({
      'address': contract.options.address,
      'payment' : payment,
      'guarantee' : guarantee,
      'createDate': Date.now(),
    });

    return Promise.resolve(contract);
  } catch(error) {
    console.error('ERROR: Failed to deploy contract: `%s`.', error);
    return Promise.reject(error);
  }
}

// Activates the storage contract.
async function activate(contract, block = 1) {
  let proof = null;
  try {
    proof = await getProofForBlock(contract, block);
  } catch(error) {
    console.error(
      'ERROR: Failed to create Merkle proof with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  try {
    await StorageContract.activate(contract.address, proof);
  } catch(error) {
    console.error(
      'ERROR: Failed to activate contract with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  let contractStatus = null;
  try  {
    contractStatus = await StorageContract.getStatus(contract.address);
  } catch(error) {
    console.error('ERROR: Failed to get status with error: `%s`.', error);
    return Promise.reject(error);
  }

  if (contractStatus === 'Active') {
    console.log(
      'INFO: Activated contract with address: `%s`.', contract.address
    );

    return Promise.resolve(contractStatus);
  } else {
    console.log('INFO: Failed to activate contract.');

    return Promise.reject(contractStatus);
  }
}

// Activates the compute contract.
async function compactivate(contract) {

  try {
    await ComputeContract.activate(contract.address);
  } catch(error) {
    console.error(
      'ERROR: Failed to activate compute contract with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  let contractStatus = null;
  try  {
    contractStatus = await ComputeContract.getStatus(contract.address);
  } catch(error) {
    console.error('ERROR: Failed to get status with error: `%s`.', error);
    return Promise.reject(error);
  }

  if (contractStatus === 'Active') {
    console.log(
      'INFO: Activated contract with address: `%s`.', contract.address
    );

    return Promise.resolve(contractStatus);
  } else {
    console.log('INFO: Failed to activate contract.');

    return Promise.reject(contractStatus);
  }
}


// Cancels the storage contract.
async function cancel(address) {
  try {
    await StorageContract.cancel(address);
  } catch(error) {
    console.error('ERROR: Failed to cancel contract with error: `%s`.', error);
    return Promise.reject(error);
  }

  let contractStatus = null;
  try {
    contractStatus = await StorageContract.getStatus(address);
  } catch(error) {
    console.error('ERROR: Failed to get status with error: `%s`.', error);
    return Promise.reject(error);
  }

  if (contractStatus === 'Cancelled') {
    console.log('INFO: Cancelled contract with address: `%s`.', address);

    return Promise.resolve(contractStatus);
  } else {
    console.error('ERROR: Failed to cancel contract.');

    return Promise.reject(contractStatus);
  }
}

// Cancels the compute contract.
async function compcancel(address) {
  try {
    await ComputeContract.cancel(address);
  } catch(error) {
    console.error('ERROR: Failed to cancel contract with error: `%s`.', error);
    return Promise.reject(error);
  }

  let contractStatus = null;
  try {
    contractStatus = await ComputeContract.getStatus(address);
  } catch(error) {
    console.error('ERROR: Failed to get status with error: `%s`.', error);
    return Promise.reject(error);
  }

  if (contractStatus === 'Cancelled') {
    console.log('INFO: Cancelled contract with address: `%s`.', address);

    return Promise.resolve(contractStatus);
  } else {
    console.error('ERROR: Failed to cancel contract.');

    return Promise.reject(contractStatus);
  }
}

// Invalidates the storage contract.
async function invalidate(address) {
  try {
    await StorageContract.invalidate(address);
  } catch(error) {
    console.error(
      'ERROR: Failed to invalidate contract with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  let contractStatus = null;
  try {
    contractStatus = await StorageContract.getStatus(address);
  } catch(error) {
    console.error('ERROR: Failed to get status with error: `%s`.', error);
    return Promise.reject(error);
  }

  if (contractStatus === 'Invalid') {
    console.log('INFO: Invalidated contract with address: `%s`.', address);

    return Promise.resolve(contractStatus);
  } else {
    console.error('ERROR: Failed to invalidate contract.');

    return Promise.reject(contractStatus);
  }
}

// Completes the storage contract.
async function complete(contract, block = 1) {
  let proof = null;
  try {
    proof = await getProofForBlock(contract, block);
  } catch(error) {
    console.error(
      'ERROR: Failed to create Merkle proof with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  try {
    await StorageContract.complete(contract.address, proof);
  } catch(error) {
    console.error(
      'ERROR: Failed to complete contract with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  let contractStatus = null;
  try  {
    contractStatus = await StorageContract.getStatus(contract.address);
  } catch(error) {
    console.error('ERROR: Failed to get status with error: `%s`.', error);
    return Promise.reject(error);
  }

  if (contractStatus === 'Complete') {
    console.log(
      'INFO: Completed contract with address: `%s`.', contract.address
    );

    return Promise.resolve(contractStatus);
  } else {
    console.log('INFO: Failed to complete contract.');

    return Promise.reject(contractStatus);
  }
}

// Completes the compute contract.
async function compcomplete(contract) {

  try {
    await ComputeContract.complete(contract.address);
  } catch(error) {
    console.error(
      'ERROR: Failed to complete contract with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  let contractStatus = null;
  try  {
    contractStatus = await ComputeContract.getStatus(contract.address);
  } catch(error) {
    console.error('ERROR: Failed to get status with error: `%s`.', error);
    return Promise.reject(error);
  }

  if (contractStatus === 'Complete') {
    console.log(
      'INFO: Completed contract with address: `%s`.', contract.address
    );

    return Promise.resolve(contractStatus);
  } else {
    console.log('INFO: Failed to complete contract.');

    return Promise.reject(contractStatus);
  }
}

// Returns the status of the storage contract.
async function status(address) {
  return StorageContract.getStatus(address);
}

// Returns the status of the compute contract.
async function computestatus(address) {
  return ComputeContract.getStatus(address);
}

// Returns the state of the storage contract.
async function info(address) {
  return StorageContract.getState(address);
}


async function computeInfo(address) {
  return ComputeContract.getState(address);
}

////////////////////////////////////////////////////////////////////////////////
// Users Registry actions...
////////////////////////////////////////////////////////////////////////////////

// Returns the upload URL of the provider at `address`.
async function getProviderUrl(address) {
  return UsersRegistry.getProviderUrl(address);
}

async function getChallengeUrl(address) {
  return UsersRegistry.getChallengeUrl(address);
}
// Returns the upload URLs of all the providers registered.
async function getRegistry() {
  return UsersRegistry.getRegistry();
}

// Registers an upload URL for the current user (provider).
async function register(uploadsUrl, challengeUrl) {
  return Promise.all([
    UsersRegistry.setProviderUrl(uploadsUrl),
    UsersRegistry.setChallengeUrl(challengeUrl)
  ]);
}



////////////////////////////////////////////////////////////////////////////////
// File actions...
////////////////////////////////////////////////////////////////////////////////

// Uploads a file with absolute filepath `filepath` to `url`.
async function upload(url, address, filepath, filename) {
  if (filename === undefined) {
    filename = path.basename(filepath);
  }

  let storageContracts = zxdb.getStorageContracts();

  let contract = storageContracts.client[address];

  if (contract === undefined) {
    return Promise.reject({
      statusCode: 400,
      error: (
        'Bad Request: Contract with address: `' + address +
        '` does not exist for client.'
      )
    });
  }

  if (contract.fileUploaded !== undefined && contract.fileUploaded == true) {
    return Promise.reject({
      statusCode: 400,
      error: 'Bad Request: File already uploaded for contract.'
    });
  }

  const options = {
    method: 'POST',
    uri: url,
    formData: {
      file: {
        value: fs.createReadStream(filepath),
        options: {
          filename: filename,
        }
      }
    }
  };

  try {
    let response = await rp(options);

    const stats = fs.statSync(filepath);

    contract.filename = filename;
    contract.filesize = stats.size;
    contract.fileUploaded = true;
    contract.localFilename = path.basename(filepath);

    zxdb.saveClientStorageContract(contract);

    return Promise.resolve(response);
  } catch(error) {
    console.error('ERROR: Failed to upload file with:', error.message);
    return Promise.reject(error);
  }
}


// Uploads a task with absolute filepath `filepath`.
async function uploadTask(truebitClient, os, url, address, taskpath, filename) {
  if (filename === undefined) {
    filename = path.basename(taskpath);
    console.log('File name : '+filename);
  }

  let computeContracts = zxdb.getComputeContracts();

  let contract = computeContracts.client[address];

  if (contract === undefined) {
    return Promise.reject({
      statusCode: 400,
      error: (
        'Bad Request: Contract with address: `' + address +
        '` does not exist for client.'
      )
    });
  }

  if (contract.taskUploaded !== undefined && contract.taskUploaded == true) {
    return Promise.reject({
      statusCode: 400,
      error: 'Bad Request: Task already uploaded for contract.'
    });
  }


  let account = await Wallet.getAccount();
  let args = JSON.parse(
    '{"options":{"account":"'+account+'","task":"'+taskpath+'"}}'
  );
  let uploaded = await truebitClient.taskGiver({os, args});
  let taskID = uploaded.logs[0].args.task;

  //TODO: Compute task gas and update JSON
  //const stats = fs.statSync(filepath);
  //contract.filename = filename;
  //contract.filesize = stats.size;

  contract.taskUploaded = true;
  contract.taskid = taskID;

  contract.localFilename = path.basename(taskpath);
  //TODO: modify uploaded contract and set the taskID field

  console.log(JSON.stringify(contract));
  console.log('URL: '+url);

  const options = {
    method: 'POST',
    uri: url,
    body: { contract: contract },
    json: true
  };

  try {
    let response = await rp(options);

    zxdb.saveClientComputeContract(contract);

    return Promise.resolve(response);
  } catch(error) {
    console.error('ERROR: Failed to notify provider with:', error.message);
    return Promise.reject(error);
  }
}



// Challenges a provider (off-chain) to present a proof for `block`.
//
// This is called in the client side.
async function challenge(url, address, block) {
  let storageContracts = zxdb.getStorageContracts();

  let contract = storageContracts.client[address];

  if (contract === undefined) {
    return Promise.reject({
      statusCode: 400,
      error: (
        'Bad Request: Contract with address: `' + address +
        '` does not exist for client.'
      )
    });
  }

  if (contract.fileUploaded === undefined || contract.fileUploaded == false) {
    return Promise.reject({
      statusCode: 400,
      error: 'Bad Request: File not yet uploaded for contract.'
    });
  }

  const options = {
    method: 'GET',
    uri: url,
  };

  let response = null;
  try {
    response = await rp(options);
  } catch(error) {
    console.error(
      'ERROR: Failed to challenge provider with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  let providerProof = null;
  try {
    providerProof = await zxmerkle.parseJSON(response);
  } catch(error) {
    console.error(
      'ERROR: Failed to JSON.parse proof with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  // NOTE: This is for demonstration purposes. In real life we would keep
  //       just a small number of blocks.
  let clientProof = null;
  try {
    clientProof = await getProofForBlock(contract, block);
  } catch(error) {
    console.error(
      'ERROR: Failed to create Merkle proof with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  return Promise.resolve(zxmerkle.compare(providerProof, clientProof));
}

// Returns a Merkle proof for `block`.
async function getProofForBlock(contract, block) {
  const uploadsLocation =
    contract.role == 'client' ?
      zxconf.STORAGE_CLIENT_UPLOADS_LOCATION :
      zxconf.STORAGE_PROVIDER_UPLOADS_LOCATION;

  const filepath = path.join(uploadsLocation, contract.localFilename);

  let tree = null;
  try {
    tree = await zxmerkle.create(filepath, block);
  } catch(error) {
    console.error(
      'ERROR: Failed to create Merkle tree with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  return zxmerkle.prove(tree.tree, tree.leaf, block);
}

////////////////////////////////////////////////////////////////////////////////
// Helper functions...
////////////////////////////////////////////////////////////////////////////////

// Returns information based on the provided configuration file.
async function conf() {
  let accountInfo = zxutils.copy(zxeth.getConf());

  try {
    accountInfo.balance = await Wallet.getAccountBalance();
  } catch (error) {
    console.error('ERROR: Failed to get balance with error: `%s`.', error);

    return Promise.reject(error);
  }

  return Promise.resolve(accountInfo);
}

// Ensures that `zxagent` is initialized correctly.
async function ensure(confFilename) {
  let config = null;
  let filename = null;

  if (fs.existsSync(confFilename)) {
    filename = confFilename;
  } else if (fs.existsSync(zxconf.CONFIG_FILENAME)) {
    filename = zxconf.CONFIG_FILENAME;
  } else {
    console.error('ERROR: No configuration file found.');
    return Promise.reject(new Error('ERROR: No configuration file found.'));
  }

  try {
    config = JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch(error) {
    console.error('ERROR: Failed to read config file with error: `%s`.', error);
    return Promise.reject(error);
  }

  zxeth.setConf(config);

  const validatePromise = zxeth.validate().catch((error) => {
    zxeth.setConf({});
    throw error;
  });

  return validatePromise;
}

// Deploys the cloudagora contracts.
async function deploy() {
  console.log('INFO: Deploying Users Registry.');

  let usersRegistry = null;
  try {
    usersRegistry = await UsersRegistry.deploy();
  } catch(error) {
    console.error(
      'ERROR: Failed to deploy registry with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  const usersRegistryAddress = usersRegistry.options.address;

  console.log('INFO: Deploying Contracts Registry.');

  let contractsRegistry = null;
  try {
    contractsRegistry = await ContractsRegistry.deploy();
  } catch(error) {
    console.error(
      'ERROR: Failed to deploy contracts registry with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  const contractsRegistryAddress = contractsRegistry.options.address;

  console.log('INFO: Deploying AuctionFactory.');

  let auctionFactory = null;
  try {
    auctionFactory = await AuctionFactory.deploy(contractsRegistryAddress);
  } catch(error) {
    console.error(
      'ERROR: Failed to deploy auction factory with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  const auctionFactoryAddress = auctionFactory.options.address;

  console.log(
    'INFO:     Users Registry address: %s',
    chalk.green(usersRegistryAddress)
  );

  console.log(
    'INFO:     Contracts Registry address: %s',
    chalk.green(contractsRegistryAddress)
  );

  console.log(
    'INFO:     AuctionFactory address: %s',
    chalk.green(auctionFactoryAddress)
  );

  console.log('\n\n');
  console.log('"registry": "%s",', usersRegistryAddress);
  console.log('"contractsRegistry": "%s",', contractsRegistryAddress);
  console.log('"auctionFactory": "%s",', auctionFactoryAddress);

  return Promise.resolve();
}

module.exports = {
  'conf': conf,
  'ensure': ensure,
  'status': status,
  'computestatus': computestatus,
  'create': create,
  'compcreate': compcreate,
  'cancel': cancel,
  'compcancel': compcancel,
  'activate': activate,
  'compactivate': compactivate,
  'invalidate': invalidate,
  'complete': complete,
  'compcomplete': compcomplete,
  'register': register,
  'files': files,
  'info': info,
  'computeInfo': computeInfo,
  'upload': upload,
  'uploadTask': uploadTask,
  deploy: deploy,
  challenge: challenge,
  getProviderUrl: getProviderUrl,
  getChallengeUrl: getChallengeUrl,
  getRegistry: getRegistry,
  getProofForBlock: getProofForBlock,
  newStorageAuction: newStorageAuction,
  getStorageAuctions: getStorageAuctions,
  newComputeAuction: newComputeAuction,
  getComputeAuctions: getComputeAuctions,
  getAuction: getAuction,
  bidToAuction: bidToAuction,
  finalizeAuction: finalizeAuction,
};
