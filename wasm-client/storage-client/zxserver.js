'use strict';

const path = require('path');
const assert = require('assert');

const Koa = require('koa');
const Router = require('@koa/router');
const KoaBody = require('koa-body');

const zxutils = require('./zxutils.js');
const zxagent = require('./zxagent.js');
const zxconf = require('./zxconf.js');
const zxdb = require('./zxdb.js');
const zxmerkle = require('./zxmerkle.js');

const app = new Koa();
const router = new Router();

async function requireStatusInactiveMiddleware(ctx, next) {
  return requireStatusMiddleware('Inactive', ctx, next);
}

async function requireStatusActiveMiddleware(ctx, next) {
  return requireStatusMiddleware('Active', ctx, next);
}

async function requireStatusMiddleware(statusCode, ctx, next) {
  // Verify that contract with `address` exists and has status `Inactive`.
  // Also verify that either the contract is not in AGENT_DB of it is
  // but has no set filename (no file upload has happened before for this
  // contract).
  const address = ctx.params.address;

  // Verify that the contract's status is still `Inactive`.
  let contractStatus = undefined;
  try {
    contractStatus = await zxagent.status(address);
  } catch (error) {
    console.error(
      'ERROR: Failed to get contract status with error `%s`.',
      error
    );

    ctx.status = 500;
    ctx.body = 'Internal Server Error: Sorry for that.';
    return;
  }

  if (contractStatus !== statusCode) {
    ctx.status = 400;
    ctx.body = (
      'Bad Request: Contract with address: `' + address +
      '` is not in status `Inactive`.'
    );
    return;
  }

  return next();
}


async function requireFileNotUploadedMiddleware(ctx, next) {
  const address = ctx.params.address;

  let storageContracts = zxdb.getStorageContracts();

  let contract = storageContracts.provider[address];

  if (contract !== undefined && contract.filename !== undefined) {
    ctx.status = 400;
    ctx.body = (
      'Bad Request: A file has already been uploaded for ' +
      'contract with address: `' + address + '`.'
    );
    return;
  }

  if (contract === undefined) {
    contract = {
      'address': address,
      'role': 'provider',
    };
  }

  ctx.storageContract = contract;

  return next();
}

async function requireFileUploadedMiddleware(ctx, next) {
  const address = ctx.params.address;

  let storageContracts = zxdb.getStorageContracts();

  let contract = storageContracts.provider[address];

  if (contract === undefined && contract.filename === undefined) {
    ctx.status = 400;
    ctx.body = (
      'Bad Request: A file has not been uploaded yet for ' +
      'contract with address: `' + address + '`.'
    );
    return;
  }

  ctx.storageContract = contract;

  return next();
}

// Challenges a contract for off-chain verification.
router.get('/challenge/:address', async (ctx) => {
  const address = ctx.params.address;

  let storageContracts = zxdb.getStorageContracts();

  let contract = storageContracts.client[address];

  if (contract === undefined) {
    ctx.status = 400;
    ctx.body = 'Bad Request: Contract with address: `' + address +
      '` does not exist for client.';
    return;
  }

  let info = null;
  try {
    info = await zxagent.info(address);
  } catch(error) {
    ctx.status = 500;
    ctx.body = 'Internal Server Error: Failed to get contract info.';
    return;
  }

  let endpoint = null;
  try {
    endpoint = await zxagent.getChallengeUrl(info.provider);
  } catch(error) {
    console.error(
      'ERROR: Failed to get provider URL with error: `%s`.', error
    );

    ctx.status = 500;
    ctx.body = 'Internal Server Error: Failed to get provider URL.';
    return;
  }

  if (endpoint === '' || endpoint === undefined) {
    console.error('ERROR: URL for provider is not set.');
    ctx.status = 400;
    ctx.body = 'Bad Request: URL for provider is not set.';
    return;
  }

  const blocks = zxmerkle.getBlocksCount(contract.filesize);

  const block = zxutils.getRandomInt(blocks);

  endpoint += '/' + address + '/' + block;

  let result = null;
  try {
    result = await zxagent.challenge(endpoint, address, block);
  } catch(error) {
    console.error(
      'ERROR: Failed to challenge provider with error: `%s`.', error
    );

    if (error.statusCode !== undefined && error.error !== undefined) {
      ctx.status = error.statusCode;
      ctx.body = error.error;
    } else {
      ctx.status = 500;
      ctx.body = 'Internal Server Error: Failed to challenge provider.';
    }
    return;
  }

  let response = {
    result: '',
    block: block,
  };

  response.result = result == true ? 'valid' : 'invalid';

  ctx.status = 200;
  ctx.body = response;
});

router.get('/prove/:address/:block', async (ctx) => {
  const address = ctx.params.address;
  const block = parseInt(ctx.params.block, 10);

  let storageContracts = zxdb.getStorageContracts();

  let contract = storageContracts.provider[address];

  if (contract === undefined) {
    ctx.status = 400;
    ctx.body = 'Bad Request: Contract with address: `' + address +
      '` does not exist for provider.';
    return;
  }

  if (contract.fileUploaded === undefined || contract.fileUploaded == false) {
    ctx.status = 400;
    ctx.body = 'Bad Request: File not yet uploaded for contract.';
    return;
  }

  let proof = null;
  try {
    proof = await zxagent.getProofForBlock(contract, block);
  } catch(error) {
    console.error(
      'ERROR: Failed to create Merkle proof with error: `%s`.', error
    );

    ctx.status = 500;
    ctx.body = 'Internal Server Error: Failed to create Merkle proof.';
  }

  ctx.status = 200;
  ctx.body = proof;
});

// Returns an empty response, required so that the `PUT` passes through.
router.options('/complete/:address', async(ctx) => {
  ctx.status = 204;
});

router.put('/complete/:address',
  requireStatusActiveMiddleware,
  requireFileUploadedMiddleware,
  async (ctx) => {
    try {
      await zxagent.complete(ctx.storageContract);
    } catch(error) {
      ctx.status = 500;
      ctx.body = 'Internal Server Error: Sorry for that.';
      return;
    }

    ctx.status = 200;
    ctx.body = {};
  });

// Returns an empty response, required so that the `PUT` passes through.
router.options('/activate/:address', async(ctx) => {
  ctx.status = 204;
});

router.put('/activate/:address',
  requireStatusInactiveMiddleware,
  requireFileUploadedMiddleware,
  async (ctx) => {
    try {
      await zxagent.activate(ctx.storageContract);
    } catch(error) {
      ctx.status = 500;
      ctx.body = 'Internal Server Error: Sorry for that.';
      return;
    }

    ctx.status = 200;
    ctx.body = {};
  });

// Returns information based on the current agent configuration
router.get('/config', async (ctx) => {
  try {
    const config = await zxagent.conf();

    ctx.body = {
      'account': config.accounts[0],
      'blockchainUrl': config.url,
      'balance': config.balance,
    };
  } catch (error) {
    // Return 500.
    ctx.status = 500;
    ctx.body = 'Internal Server Error: Sorry for that.';
  }
});

router.post('/upload-file/',
  KoaBody({
    multipart: true,
    formidable: {
      uploadDir: zxconf.STORAGE_CLIENT_UPLOADS_LOCATION
    }
  }),
  async (ctx) => {
    const address = ctx.request.body.address;

    // Get contract info in order to find provider's address.
    let info = null;
    try {
      info = await zxagent.info(address);
    } catch(error) {
      ctx.status = 500;
      ctx.body = 'Internal Server Error: Failed to get contract info.';
      return;
    }

    // Get provider's uploads url from registry based on provider's
    // address.
    let endpoint = null;
    try {
      endpoint = await zxagent.getProviderUrl(info.provider);
    } catch(error) {
      console.error(
        'ERROR: Failed to get provider URL with error: `%s`.', error
      );

      ctx.status = 500;
      ctx.body = 'Internal Server Error: Failed to get provider URL.';
      return;
    }

    if (endpoint === '' || endpoint === undefined) {
      console.error('ERROR: URL for provider is not set.');
      ctx.status = 400;
      ctx.body = 'Bad Request: URL for provider is not set.';
      return;
    }

    // Format upload URL.
    endpoint += '/' + address;

    // Calculate local file path.
    const file = ctx.request.files.file;
    const localFilename = path.basename(file.path);
    const localFilepath = path.join(
      zxconf.STORAGE_CLIENT_UPLOADS_LOCATION,
      localFilename
    );

    // Upload file to provider.
    try {
      await zxagent.upload(endpoint, address, localFilepath, file.name);
    } catch(error) {
      zxutils.logError(error);

      if (error.statusCode !== undefined && error.error !== undefined) {
        ctx.status = error.statusCode;
        ctx.body = error.error;
      } else {
        ctx.status = 500;
        ctx.body = 'Internal Server Error: Sorry for that.';
      }
      return;
    }

    ctx.status = 200;
    ctx.body = {};
  });

// Stores a file posted from the client to a local storage folder.
router.post(
  '/uploads/:address/',
  requireStatusInactiveMiddleware,
  requireFileNotUploadedMiddleware,
  KoaBody({
    multipart: true,
    formidable: {
      uploadDir: zxconf.STORAGE_PROVIDER_UPLOADS_LOCATION
    }
  }),
  async (ctx) => {
    // Save information related to upload to AGENT_DB.
    let contract = ctx.storageContract;

    contract.filename = ctx.request.files.file.name;
    contract.filesize = ctx.request.files.file.size;
    contract.localFilename = path.basename(ctx.request.files.file.path);
    contract.uploadDate = Date.now();
    contract.fileUploaded = true;

    zxdb.saveProviderStorageContract(contract);

    ctx.status = 200;
  });


// Returns an empty response, required so that the `PUT` passes through.
router.options('/cancel/:address', async(ctx) => {
  ctx.status = 204;
});

// Cancel the contract at the `address`.
router.put(
  requireStatusInactiveMiddleware,
  '/cancel/:address',
  KoaBody(),
  async (ctx) => {
    const address = ctx.params.address;

    try {
      await zxagent.cancel(address);
    } catch (error) {
      ctx.status = 500;
      ctx.body = 'Internal Server Error: Sorry for that.';
      return;
    }

    ctx.status = 200;
    ctx.body = {};
  });

// Returns an empty response, required so that the `PUT` passes through.
router.options('/invalidate/:address', async(ctx) => {
  ctx.status = 204;
});

// Cancel the contract at the `address`.
router.put(
  requireStatusActiveMiddleware,
  '/invalidate/:address',
  KoaBody(),
  async (ctx) => {
    const address = ctx.params.address;

    try {
      await zxagent.invalidate(address);
    } catch (error) {
      ctx.status = 500;
      ctx.body = 'Internal Server Error: Sorry for that.';
      return;
    }

    ctx.status = 200;
    ctx.body = {};
  });

// Returns a list of contract addresses stored locally in `CONTRACTS_DB`.
router.get(
  '/contracts/:role_or_address',
  async (ctx) => {
    const role_or_address = ctx.params.role_or_address;

    let contracts = [];

    if (role_or_address == 'client') {
      // Return information for all storage contracts where
      // the user is a client.
      let storageContracts = zxdb.getStorageContracts();
      contracts = Object.values(storageContracts.client);
    } else if (role_or_address == 'provider') {
      // Return information for all storage contracts where
      // the user is a provider.
      let storageContracts = zxdb.getStorageContracts();
      contracts = Object.values(storageContracts.provider);
    } else {
      // Return information for a specific contract with address
      // `role_or_address`.
      let storageContracts = zxdb.getStorageContracts();

      if (role_or_address in storageContracts.client) {
        contracts.push(storageContracts.client[role_or_address]);
      } else if (role_or_address in storageContracts.provider) {
        contracts.push(storageContracts.provider[role_or_address]);
      } else {
        console.error(
          'ERROR: Could not find contract with address: %s', role_or_address
        );

        ctx.status = 404;
        ctx.body = 'Page Not Found: Sorry for that.';
        return;
      }
    }

    // The idea here is that all this calls to `info()` are
    // done asynchronously, not sure if that's what's happening
    // but kinda looks good from here.
    let contractPromises = [];
    for (let c in contracts) {
      contractPromises.push(zxagent.info(contracts[c].address));
    }

    try {
      let contractDetails = await Promise.all(contractPromises);

      assert(contracts.length == contractDetails.length);

      for (let c in contracts) {
        assert(contracts[c].address == contractDetails[c].address);

        delete contractDetails[c].address;

        contracts[c].details = contractDetails[c];
      }

      if (role_or_address !== 'client' && role_or_address !== 'provider') {
        // We are asking for a specific contract by address return an
        // object not a list.
        ctx.body = contracts[0];
      } else {
        ctx.body = contracts;
      }
    } catch (error) {
      console.error('ERROR: contracts_handle: %s', error);

      // Return 500.
      ctx.status = 500;
      ctx.body = 'Internal Server Error: Sorry for that.';
    }
  });

router.get(
  '/compcontracts/:role_or_address',
  async (ctx) => {
    const role_or_address = ctx.params.role_or_address;

    let contracts = [];

    if (role_or_address == 'client') {
      let computeContracts = zxdb.getComputeContracts();
      contracts = Object.values(computeContracts.client);
    } else if (role_or_address == 'provider') {
      let computeContracts = zxdb.getComputeContracts();
      contracts = Object.values(computeContracts.provider);
    } else {
      let computeContracts = zxdb.getComputeContracts();

      if (role_or_address in computeContracts.client) {
        contracts.push(computeContracts.client[role_or_address]);
      } else if (role_or_address in computeContracts.provider) {
        contracts.push(computeContracts.provider[role_or_address]);
      } else {
        console.error(
          'ERROR: Could not find contract with address: %s', role_or_address
        );

        ctx.status = 404;
        ctx.body = 'Page Not Found: Sorry for that.';
        return;
      }
    }



    //TODO: retrieve details for compute contracts
    // The idea here is that all this calls to `info()` are
    // done asynchronously, not sure if that's what's happening
    // but kinda looks good from here.
    let contractPromises = [];
    for (let c in contracts) {
      contractPromises.push(zxagent.computeInfo(contracts[c].address));
    }

    try {

      let contractDetails = await Promise.all(contractPromises);

      assert(contracts.length == contractDetails.length);

      for (let c in contracts) {
        assert(contracts[c].address == contractDetails[c].address);

        delete contractDetails[c].address;

        contracts[c].details = contractDetails[c];
      }


      if (role_or_address !== 'client' && role_or_address !== 'provider') {
        // We are asking for a specific contract by address return an
        // object not a list.
        ctx.body = contracts[0];
      } else {
        ctx.body = contracts;
      }
    } catch (error) {
      console.error('ERROR: contracts_handle: %s', error);

      // Return 500.
      ctx.status = 500;
      ctx.body = 'Internal Server Error: Sorry for that.';
    }
  });

// Returns all the registry entries.
router.get('/registry', async (ctx) => {
  try {
    const providerUrls = await zxagent.getRegistry();

    ctx.status = 200;
    ctx.body = providerUrls;
  } catch (error) {
    // Return 500.
    ctx.status = 500;
    ctx.body = 'Internal Server Error: Sorry for that.';
  }
});

// Returns all auctions.
router.get('/auctions/:type_or_address', async (ctx) => {
  const type_or_address = ctx.params.type_or_address;

  let auctions = null;

  if (type_or_address === 'storage') {
    try {
      auctions = await zxagent.getStorageAuctions();
    } catch(error) {
      console.error(
        'ERROR: Failed to get storage auctions with error: `%s`.', error
      );

      ctx.status = 500;
      ctx.body = 'Internal Server Error: Sorry for that.';
      return;
    }
  } else if (type_or_address === 'compute') {
    try {
      auctions = await zxagent.getComputeAuctions();
    } catch(error) {
      console.error(
        'ERROR: Failed to get storage auctions with error: `%s`.', error
      );

      ctx.status = 500;
      ctx.body = 'Internal Server Error: Sorry for that.';
      return;
    }
  } else {
    auctions = [type_or_address];
  }

  let auctionsPromises = [];
  for (let i = 0; i < auctions.length; i++) {
    const auctionPromise = zxagent
      .getAuction(auctions[i])
      .then((auction) => {
        auction.taskId = '';
        auction.duration = auction.duration / 1000;

        return auction;
      });

    auctionsPromises.push(auctionPromise);
  }

  try {
    const results = await Promise.all(auctionsPromises);

    ctx.status = 200;

    if (type_or_address !== 'storage' && type_or_address !== 'compute') {
      ctx.body = results[0];
    } else {
      ctx.body = results;
    }
  } catch(error) {
    console.error(
      'ERROR: Failed to get auction contracts with error: `%s`.', error
    );

    ctx.status = 500;
    ctx.body = 'Internal Server Error: Sorry for that.';
    return;
  }
});

// Returns an empty response, required so that the `PUT` passes through.
router.options('/bid/:address/:amount', async(ctx) => {
  ctx.status = 204;
});

// Bid to the auction at the `address`.
router.put('/bid/:address/:amount', async (ctx) => {
  const address = ctx.params.address;
  const amount = parseInt(ctx.params.amount);

  try {
    await zxagent.bidToAuction(address, amount);

    const auction = await zxagent
      .getAuction(address)
      .then((auction) => {
        auction.taskId = '';
        auction.duration = auction.duration / 1000;

        return auction;
      });

    ctx.status = 200;
    ctx.body = auction;
  } catch(error) {
    console.error('ERROR: Failed to bid to auction with error: `%s`.', error);

    ctx.status = 500;
    ctx.body = 'Internal Server Error: Sorry for that.';
    return;
  }
});

// Returns an empty response, required so that the `PUT` passes through.
router.options('/auction/:type', async(ctx) => {
  ctx.status = 204;
});

// Creates a new auction.
router.post(
  '/auction/:type',
  KoaBody(),
  async (ctx) => {
    const auctionType = ctx.params.type;
    const duration = ctx.request.body.duration;
    const filesizeOrGas = ctx.request.body.filesizeOrGas;

    if (auctionType === 'storage') {
      try {
        const _auction = await zxagent.newStorageAuction(
          filesizeOrGas, duration * 1000
        );

        ctx.status = 204;
        return;
      } catch (error) {
        console.error(
          'ERROR: Failed to create auction with error: `%s`.', error
        );

        ctx.status = 500;
        ctx.body = 'Internal Server Error: Sorry for that.';
        return;
      }
    } else if (auctionType === 'compute') {
      try {
        const _auction = await zxagent.newComputeAuction(
          filesizeOrGas, duration * 1000
        );

        ctx.status = 204;
        return;
      } catch (error) {
        console.error(
          'ERROR: Failed to create auction with error: `%s`.', error
        );

        ctx.status = 500;
        ctx.body = 'Internal Server Error: Sorry for that.';
        return;
      }
    }

    ctx.status = 400;
    ctx.body = 'Bad Request: Auction type not supported';
  });

// Finalizes the auction at the `address`.
router.post(
  '/finalize/:address',
  KoaBody({
    multipart: true,
    formidable: {
      uploadDir: zxconf.STORAGE_CLIENT_UPLOADS_LOCATION
    }
  }),
  async (ctx) => {
    const address = ctx.params.address;

    let localFilepath = undefined;
    if (ctx.request.files != undefined){
      const file = ctx.request.files.file;
      if(file != undefined){
        const localFilename = path.basename(file.path);
        localFilepath = path.join(
          zxconf.STORAGE_CLIENT_UPLOADS_LOCATION,
          localFilename
        );
      }
    }

    try {
      const auction = await zxagent
        .finalizeAuction(address, localFilepath)
        .then((auction) => {
          auction.taskId = '';
          auction.duration = auction.duration / 1000;

          return auction;
        });

      ctx.status = 200;
      ctx.body = auction;
    } catch(error) {
      console.error(
        'ERROR: Failed to finalize auction with error: `%s`.', error
      );

      ctx.status = 500;
      ctx.body = 'Internal Server Error: Sorry for that.';
      return;
    }
  });

// Registers routes, set headers for all requests.
app
  .use(async (ctx, next) => {
    console.log(ctx.request.method, ':', ctx.request.href);

    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    ctx.set(
      'Access-Control-Allow-Headers',
      'Origin, Content-Type, Accept, X-Requested-With'
    );

    await next();
  })
  .use(router.routes());


// Starts the server, listens for incoming connections.
async function listen(mode, host, port) {
  const server_host = host === undefined ? zxconf.HOST : host;
  const server_port = port === undefined ? zxconf.PORT : port;

  app.listen(server_port, server_host);

  console.log('INFO: Listening on: %s:%d', server_host, server_port);
}


module.exports = {
  'listen': listen,
  'app': app
};
