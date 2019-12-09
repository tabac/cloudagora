#!/usr/bin/env node

'use strict';

const Koa = require('koa');
const koaMount = require('koa-mount');
const program = require('commander');

const truebitClient = require('../cli/cliLib.js');
const zxagent = require('../wasm-client/storage-client/zxagent.js');
const zxeth = require('../wasm-client/storage-client/zxeth.js');
const storageApp = require('../wasm-client/storage-client/zxserver.js');
const computeApp = require('./compute-api.js');


const app = new Koa();

app.use(koaMount(storageApp.app));
app.use(koaMount(computeApp.app));

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

program
  .command('daemon')
  .option('-c, --config <path>', 'Specify configuration file.')
  .option('-h, --host <host>', 'Specify the host to listen to.')
  .option('-p, --port <port>', 'Specify the port to listen to.')
  .action(async (options) => {
    const host = options.host !== undefined ? options.host : '0.0.0.0';
    const port = options.port !== undefined ? options.port : 9870

    try {
      await zxagent.ensure(options.config);
      let os = await computeApp.init()

      let conf = zxeth.getConf()

      let account = conf['accounts'][0]
      console.log('Server account = '+account)

      app.listen(port, host);
      
      const recover = -1;
      const test = false;

      truebitClient.initTaskGiver({os, account})
      if(conf['role'] == 'provider'){
	console.log('Initializing a provider')
      	truebitClient.initSolver({os, account, recover, test})
      }else{
	console.log('Initializing a client')
      }
 
    } catch (error) {
      console.error('ERROR: Failed to start server with: %s', error);
    }
  });

program.parse(process.argv);
