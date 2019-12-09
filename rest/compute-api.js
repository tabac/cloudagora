'use strict';

const path = require('path');
const assert = require('assert');

const Koa = require('koa');
const Router = require('@koa/router');
const KoaBody = require('koa-body');

const truebitClient = require('../cli/cliLib.js');
const zxagent = require('../wasm-client/storage-client/zxagent.js');
const zxdb = require('../wasm-client/storage-client/zxdb.js');
const Wallet = require('../wasm-client/storage-client/wallet.js');

const app = new Koa();
const router = new Router();

let configPath = './wasm-client/config.json';
console.log(configPath);

var os;

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
     contractStatus = await zxagent.computestatus(address);
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



async function requireTaskUploadedMiddleware(ctx, next) {
  const address = ctx.params.address;

  let computeContracts = zxdb.getComputeContracts();

  let contract = computeContracts.provider[address];
  console.log('Loaded contract in providers middleware:');
  console.log(JSON.stringify(contract));

  if (contract === undefined && contract.taskUploaded === undefined) {
    ctx.status = 400;
    ctx.body = (
      'Bad Request: A file has not been uploaded yet for ' +
      'contract with address: `' + address + '`.'
    );
    return;
  }

  ctx.computeContract = contract;

  return next();
}


router.options('/verifier/:enableValue', async(ctx) => {
  ctx.status = 204;
});

// select a solver for a task
router.put('/verifier/:enableValue', KoaBody(),
	async (ctx) => {
                const action = ctx.params.enableValue;
		try {
		    if(action == 1){
		        console.log('Activate verifier:', action )
		        const account = Wallet.getAccount();
		        const recover = -1;
		        const test = false;
		        ctx.body =  await JSON.stringify(truebitClient.initVerifier({ os, account, recover, test }))
		    }else{
		        console.log('Deactivate verifier:', action )
			//FIXME: works only if a single solver-verifier are booted in this rest-server
		      const args = {num: 1};
		      await truebitClient.stopProcesse({ os, args});
          ctx.body = {};
		    }
		    ctx.status = 200;
		    return;
		} catch(error) {
		  ctx.status = 500;
		  ctx.body = 'Internal Server Error: Failed to get contract info.';
		  return;
		}
	}
);


// Initiate a new Truebit agent
router.post('/start', KoaBody(),
	async (ctx) => {
		const recover = -1;
		const test = false;
		console.log(ctx.request.body);
		const account = ctx.request.body.account;
		const taskType = ctx.request.body.type; // this should be task/solve/verify
		console.log('Task type = '+taskType);

		switch (taskType) {
		    case 'task':
			console.log('Initializing TaskGiver...');
		        ctx.body =  truebitClient.initTaskGiver({ os, account })
			ctx.status = 200;
			break;
		    case 'solve':
			console.log('Initializing Solver...');
			ctx.body = truebitClient.initSolver({ os, account, recover, test})
			ctx.status = 200;
			break;
		    case 'verify':
			console.log('Initializing Verifier...');
			ctx.body =  truebitClient.initVerifier({ os, account, recover, test })
			ctx.status = 200;
			break;
		    default:
			ctx.status = 400;
			ctx.body = 'Invalid task type.'
		}
		return;
});

// get new task notification
//router.options('/newtask', async(ctx) => {
//  ctx.status = 204;
//});
router.post('/newtask', KoaBody(),
	async (ctx) => {
		const contract = ctx.request.body.contract;
		zxdb.saveProviderComputeContract(contract);
		ctx.status = 200;

	}
);

// Fetch all accounts
router.get('/accounts',
	async (ctx) => {
		ctx.body = await truebitClient.accounts({os});
		ctx.status = 200;
		return
});


// Returns an empty response, required so that the `POST` passes through.
router.options('/submit', async(ctx) => {
  ctx.status = 204;
});
// Submit a new task
router.post('/submit', KoaBody(),
	async (ctx) => {
		const address = ctx.request.body.address;
		const taskpath = ctx.request.body.tpath;

		 // Get contract info in order to find provider's address.
		let info = null;
		try {
		  info = await zxagent.computeInfo(address);
		} catch(error) {
		  ctx.status = 500;
		  ctx.body = 'Internal Server Error: Failed to get contract info.';
		  return;
		}

		console.log('info: '+info)

		// Get provider's uploads url from registry based on provider's
		// address.
		let endpoint = null;
		try {
		  endpoint = await zxagent.getProviderUrl(info.provider);
		} catch(error) {
		  console.error('ERROR: Failed to get provider URL with error: `%s`.', error);
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

		//FIXME: parse provider url and extract host-port information
		endpoint = 'http://127.0.0.1:9999'
		endpoint += '/newtask';
		console.log('ENDPOINT = '+endpoint)

		const url = ctx.request.body.url;
		ctx.body = await JSON.stringify(zxagent.uploadTask(truebitClient, os, endpoint, address, taskpath));
		ctx.status = 200;
		return;
});

// only for test networks. Skips blocks in order not to experience latency in
// transaction validation
router.get('/skip',
	async (ctx) => {
		const args = JSON.parse('{"options":{"number":"100"}}');
		await truebitClient.skipHelper({os, args});
		ctx.status = 200;
		return;
});

// show the balance of an account
router.get('/balance/:account',
	async (ctx) => {
		const account = ctx.params.account;
		const args = JSON.parse('{"options":{"account":"'+account+'"}}');
		ctx.body = await truebitClient.balance({os, args});
		ctx.status = 200;
		return;
});


router.options('/select/:address', async(ctx) => {
  ctx.status = 204;
});

// select a solver for a task
router.put('/select/:address', KoaBody(),
  requireStatusActiveMiddleware,
  requireTaskUploadedMiddleware,
  async (ctx) => {
    const account = Wallet.getAccount();
    console.log('Executor Acc: '+account)
    const taskID = ctx.computeContract['taskid'];
    console.log('task: '+taskID)
    let args = JSON.parse('{"options":{"account":"'+account+'","task":"'+taskID+'"}}');
    ctx.body = await truebitClient.selectSolver({os, args});

    args = {
      options: {
        number: 100
      }
    };

    await truebitClient.skipHelper({os, args});

    ctx.status = 200;
  }
);

// solver registers for a task
router.post('/register', KoaBody(),
        async (ctx) => {
                const account = ctx.request.body.account;
                const taskID = ctx.request.body.task;
                let args = JSON.parse('{"options":{"account":"'+account+'","task":"'+taskID+'"}}');
                ctx.body = await truebitClient.register({os, args});
                ctx.status = 200;
                return;
});

// list solvers and verifiers, and the tasks they are involved in
router.get('/ps',
	async (ctx) => {
		ctx.body = await truebitClient.listProcesses({os});
		ctx.status = 200;
		return;
});

// Returns an empty response, required so that the `PUT` passes through.
router.options('/compactivate/:address', async(ctx) => {
  ctx.status = 204;
});

router.put('/compactivate/:address', KoaBody(),
  requireStatusInactiveMiddleware,
  requireTaskUploadedMiddleware,
  async (ctx) => {
    try {
      let account = await Wallet.getAccount();

      //FIXME: Call of smart contract's `activate()` function fails. why??
      await zxagent.compactivate(ctx.computeContract);

      const taskID = ctx.computeContract.taskid;
      let args = JSON.parse('{"options":{"account":"'+account+'","task":"'+taskID+'"}}');
      ctx.body = await truebitClient.register({os, args});
    } catch(error) {
      ctx.status = 500;
      ctx.body = 'Internal Server Error: Sorry for that.';
      return;
    }

    ctx.status = 200;
    ctx.body = {};
  });


// Returns an empty response, required so that the `PUT` passes through.
router.options('/compcancel/:address', async(ctx) => {
  ctx.status = 204;
});

// Cancel the contract at the `address`.
router.put(
  requireStatusInactiveMiddleware,
  '/compcancel/:address',
  KoaBody(),
  async (ctx) => {
    const address = ctx.params.address;

    try {
      await zxagent.compcancel(address);
    } catch (error) {
      ctx.status = 500;
      ctx.body = 'Internal Server Error: Sorry for that.';
      return;
    }

    ctx.status = 200;
    ctx.body = {};
});

// Returns an empty response, required so that the `PUT` passes through.
router.options('/compcomplete/:address', async(ctx) => {
  ctx.status = 204;
});

router.put('/compcomplete/:address',
  requireStatusActiveMiddleware,
  requireTaskUploadedMiddleware,
  async (ctx) => {
    try {
      await zxagent.compcomplete(ctx.computeContract);
    } catch(error) {
      ctx.status = 500;
      ctx.body = 'Internal Server Error: Sorry for that.';
      return;
    }

    ctx.status = 200;
    ctx.body = {};
 });

// list tasks submitted by a client
router.get('/clientTasks/:account',
	async (ctx) => {
		const account = ctx.params.account;
		const args = JSON.parse('{"options":{"account":"'+account+'"}}');
		ctx.body = await truebitClient.getSubmitted({os, args});
		ctx.status = 200;
		return;
});


// list all available tasks where a specific solver can register to
router.get('/lstasks/:account',
	async (ctx) => {
		const account = ctx.params.account;
		const args = JSON.parse('{"options":{"account":"'+account+'"}}');
		ctx.body = await truebitClient.availableTasks({os, args});
		ctx.status = 200;
		return;
});


app.use(async (ctx, next) => {
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
async function listen(host, port) {
  const server_host = host;
  const server_port = port;

  app.listen(server_port, server_host);

  console.log('INFO: Listening on: %s:%d', server_host, server_port);
}


module.exports = {
  'app': app,
  init: async () => {
	os = await truebitClient.setup(configPath);
	return os;
  }
};
