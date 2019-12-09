'use strict';

const fs = require('fs');

const zxconf = require('./zxconf.js');
const zxutils = require('./zxutils.js');
const zxeth = require('./zxeth.js');
const Wallet = require('./wallet.js');

const web3 = zxeth.getWeb3();


////////////////////////////////////////////////////////////////////////////////
// Storage Contract Actions...
////////////////////////////////////////////////////////////////////////////////

// Deploys a storage contract.
//
// Returns a promise to the deploy transaction.
async function deploy(
  taskId,
  providerAddress,
  fileHash,
  payment,
  guarantee,
  duration,
  contractsRegistry,
  abi = undefined,
  bytecode = undefined
) {
  if (abi === undefined) {
    abi = await readStorageContractABI();
  }

  if (bytecode === undefined) {
    bytecode = await readStorageContractBIN();
  }

  let contract = null;
  try {
    contract = new web3.eth.Contract(abi);
  } catch(error) {
    console.error('ERROR: Failed to create contract with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    await Wallet.unlockAccount();
  } catch(error) {
    console.error('ERROR: Failed to unlock account with error: `%s`.', error);
    return Promise.reject(error);
  }

  let contractConstructorArgs = [
    taskId,
    Wallet.getAccount(),
    providerAddress,
    payment,
    guarantee,
    duration,
    contractsRegistry
  ];

  let transaction = null;
  try {
    transaction = await contract.deploy({
      'data': bytecode,
      'arguments': contractConstructorArgs,
    }).send({
      'from': Wallet.getAccount(),
      'gas': 5200000,
      'value': payment
    }).on('error', (error) => {
      console.error(
        'ERROR: Failed to deploy contract with error: `%s`.', error
      );
    }).on('transactionHash', (transactionHash) => {
      console.log('INFO: Received transaction hash: `%s`.', transactionHash);
    }).on('receipt', () => {
      console.log('INFO: Received transaction receipt!');
    }).on('confirmation', (confirmationNumber) => {
      console.log(
        'INFO: Received confirmation number: `%s`.',
        confirmationNumber
      );
    });
  } catch(error) {
    console.error('ERROR: Failed to deploy contract: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    await setFileHash(transaction.options.address, fileHash);
  } catch(error) {
    console.error('ERROR: Failed to set fileHash with error: `%s`.', error);
    return Promise.reject(error);
  }

  return Promise.resolve(transaction);
}


// Activates the storage contract at the `address`.
//
// Returns a promise to a call to the `activate` method for
// the contract at `address`.
async function activate(address, proof, abi = undefined) {
  if (abi === undefined) {
    abi = await readStorageContractABI();
  }

  let contract = null;
  try {
    contract = new web3.eth.Contract(abi, address);
  } catch(error) {
    console.error('ERROR: Failed to create contract with error: `%s`.', error);
    return Promise.reject(error);
  }

  let guarantee = null;
  try {
    guarantee = await contract.methods.getGuarantee().call();
  } catch(error) {
    console.error(
      'ERROR: Failed to call `getGuarantee()` with error: `%s`.', error
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
    const activatePromise = contract
      .methods
      .activate(
        proof.leaf,
        proof.hashes,
        proof.orientations,
      ).send({
        'from': Wallet.getAccount(),
        'gas': 5200000,
        'value': guarantee
      });

    return activatePromise;
  } catch(error) {
    console.error(
      'ERROR: Failed to call `activate()` with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}

// Cancels the storage contract at the `address`.
//
// Returns a promise to a call to the `cancel` method for
// the contract at `address`.
async function cancel(address, abi = undefined) {
  if (abi === undefined) {
    abi = await readStorageContractABI();
  }

  let contract = null;
  try {
    contract = new web3.eth.Contract(abi, address);
  } catch(error) {
    console.error(
      'ERROR: Failed to create storage contract with error: `%s`.', error
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
    const cancelPromise = contract
      .methods
      .cancel()
      .send({
        'from': Wallet.getAccount(),
      });

    return cancelPromise;
  } catch(error) {
    console.error('ERROR: Failed to call `cancel()` with error: `%s`.', error);
    return Promise.reject(error);
  }
}


// Invalidates the storage contract at the `address`.
//
// Returns a promise to a call to the `invalidate method
// for the contract at `address`.
async function invalidate(address, abi = undefined) {
  if (abi === undefined) {
    abi = await readStorageContractABI();
  }

  let contract = null;
  try {
    contract = new web3.eth.Contract(abi, address);
  } catch(error) {
    console.error(
      'ERROR: Failed to create storage contract with error: `%s`.', error
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
    const invalidatePromise = contract
      .methods
      .invalidate()
      .send({
        'from': Wallet.getAccount()
      });

    return invalidatePromise;
  } catch(error) {
    console.error(
      'ERROR: Failed to call `invalidate()` with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}

// Completes the storage contract at the `address`.
//
// Returns a promise to a call to the `complete` method for
// the contract at `address`.
async function complete(address, proof, abi = undefined) {
  if (abi === undefined) {
    abi = await readStorageContractABI();
  }

  let contract = null;
  try {
    contract = new web3.eth.Contract(abi, address);
  } catch(error) {
    console.error('ERROR: Failed to create contract with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    await Wallet.unlockAccount();
  } catch(error) {
    console.error('ERROR: Failed to unlock account with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    const completePromise = contract
      .methods
      .complete(
        proof.leaf,
        proof.hashes,
        proof.orientations,
      ).send({
        'from': Wallet.getAccount(),
        'gas': 5200000,
      });

    return completePromise;
  } catch(error) {
    console.error(
      'ERROR: Failed to call `complete()` with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}


////////////////////////////////////////////////////////////////////////////////
// Storage Contract Getters...
////////////////////////////////////////////////////////////////////////////////

// Gets the storage contract's Merkle tree root hash.
//
// Returns a promise to a call to the `getFileHash` method for
// the contract at `address`.
async function getFileHash(address, abi = undefined) {
  if (abi === undefined) {
    abi = await readStorageContractABI();
  }

  try {
    const contract = new web3.eth.Contract(abi, address);

    return contract.methods.getFileHash().call();
  } catch(error) {
    console.error(
      'ERROR: Failed to create storage contract with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}


// Gets the storage contract's status.
//
// Returns a promise to a call to the `getStatus` method for
// the contract at `address`.
async function getStatus(address, abi = undefined) {
  if (abi === undefined) {
    abi = await readStorageContractABI();
  }

  try {
    const contract = new web3.eth.Contract(abi, address);

    const statusPromise = contract
      .methods
      .getStatus()
      .call()
      .then((statusCode) => {
        return zxutils.statusDescription(statusCode);
      })
      .catch((err) => {
        console.error('ERROR: Failed to call `getStatus` with error %s.', err);
      });

    return statusPromise;
  } catch(error) {
    console.error(
      'ERROR: Failed to create storage contract with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}

// Gets the storage contract's state.
//
// Calls a number of contract getters to assemble the contract state.
// Returns a promise to the completion of all the contract's method calls.
async function getState(address, abi = undefined) {
  if (abi === undefined) {
    abi = await readStorageContractABI();
  }

  let contract = null;
  try {
    contract = new web3.eth.Contract(abi, address);
  } catch(error) {
    console.error(
      'ERROR: Failed to create storage contract with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  const contractStatePromise = Promise.all([
    contract.methods.getClientAddress().call(),
    contract.methods.getProviderAddress().call(),
    contract.methods.getPayment().call(),
    contract.methods.getGuarantee().call(),
    contract.methods.getDuration().call(),
    contract.methods.getActivateDate().call(),
    contract.methods.getEndDate().call(),
    contract.methods.getFileHash().call(),
    contract.methods.getStatus().call(),
  ])
    .then(values => {
      let contractState = {
        'address': address,
        'client': '',
        'provider': '',
        'payment': 0,
        'guarantee': 0,
        'duration': 0,
        'activateDate': 0,
        'endDate': 0,
        'fileHash': '',
        'status': ''
      };

      contractState.client = values[0];
      contractState.provider = values[1];
      contractState.payment = parseFloat(values[2]);
      contractState.guarantee = parseFloat(values[3]);
      contractState.duration = parseFloat(values[4]);
      contractState.activateDate = parseFloat(values[5]);
      contractState.endDate = parseFloat(values[6]);
      contractState.fileHash = values[7];
      contractState.status = zxutils.statusDescription(values[8]);

      return Promise.resolve(contractState);
    })
    .catch((error) => {
      console.error(
        'ERROR: Failed to get contract information with error: `%s`.',
        error
      );
      return Promise.reject(error);
    });

  return contractStatePromise;
}


////////////////////////////////////////////////////////////////////////////////
// Storage Contract Setters...
////////////////////////////////////////////////////////////////////////////////


// Sets the storage contract's Merkle tree root hash.
//
// Returns a promise to a call to the `setFileHash` method for
// the contract at `address`.
async function setFileHash(address, fileHash, abi = undefined) {
  if (abi === undefined) {
    abi = await readStorageContractABI();
  }

  let contract = null;
  try {
    contract = new web3.eth.Contract(abi, address);
  } catch(error) {
    console.error('ERROR: Failed to create contract with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    await Wallet.unlockAccount();
  } catch(error) {
    console.error('ERROR: Failed to unlock account with error: `%s`.', error);
    return Promise.reject(error);
  }

  try {
    return contract
      .methods
      .setFileHash(fileHash)
      .send({
        'from': Wallet.getAccount(),
        'gas': 5200000,
      });
  } catch(error) {
    console.error(
      'ERROR: Failed to call `setFileHash()` with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}


////////////////////////////////////////////////////////////////////////////////
// Helper Functions...
////////////////////////////////////////////////////////////////////////////////

// Reads the storage contract's ABI.
//
// The location is specified in the agent's config.
async function readStorageContractABI() {
  try {
    const abi = JSON.parse(
      fs.readFileSync(zxconf.STORAGE_CONTRACT_ABI, 'utf8')
    );

    return Promise.resolve(abi);
  } catch(error) {
    console.error(
      'ERROR: Failed to read contract ABI with error: `%s`.', error
    );
    return Promise.reject(error);
  }
}

// Reads the storage contract's BIN.
//
// The location is specified in the agent's config.
async function readStorageContractBIN() {
  try {
    const bytecode = '0x' + fs.readFileSync(
      zxconf.STORAGE_CONTRACT_BIN, 'utf8'
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
  cancel: cancel,
  activate: activate,
  complete: complete,
  invalidate: invalidate,
  getStatus: getStatus,
  getFileHash: getFileHash,
  getState: getState,
  setFileHash: setFileHash,
};
