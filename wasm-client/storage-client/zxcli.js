#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const program = require('commander');
const assert = require('assert');

const zxutils = require('./zxutils.js');
const zxagent = require('./zxagent.js');
const zxserver = require('./zxserver.js');
const zxconf = require('./zxconf.js');
const zxdb = require('./zxdb.js');

program
  .version('0.0.7');

program
  .command('configuration')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (options) => {
    try {
      await zxagent.ensure(options.config);

      const accountInfo = await zxagent.conf();

      console.log('\n' + JSON.stringify(accountInfo, null, 2));
    } catch (_) {
      // Errors should be already logged.
    }
  });

program
  .command('status <address>')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (address, options) => {
    try {
      await zxagent.ensure(options.config);

      const result = await zxagent.status(address);

      // Log contract status.
      let colorState = chalk.blue(result);
      if (result.status == 'Unknown') {
        colorState = chalk.red(result);
      }

      console.log(
        'INFO: Contract status with address: ' + address + ' is: ' + colorState
      );
    } catch (_) {
      // Errors are already logged.
    }
  });

program
  .command('info <address>')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (address, options) => {
    try {
      await zxagent.ensure(options.config);

      let storageContracts = zxdb.getStorageContracts();

      let contract = storageContracts.client[address];

      if (contract === undefined) {
        contract = storageContracts.provider[address];
      }

      if (contract === undefined) {
        console.error(
          'ERROR: Could not find contract with address: %s', address
        );
        return;
      }

      const contractDetails = await zxagent.info(address);

      assert(contract.address == contractDetails.address);

      delete contractDetails.address;

      contract.details = contractDetails;

      console.log(chalk.green('Contract info:'));
      console.log(contract);
    } catch (_) {
      // Errors are already logged.
    }
  });

program
  .command('create <address> <filename> <payment> <guarantee> <duration>')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (address, filename, payment, guarantee, duration, options) => {
    if (!zxutils.isNumber(payment) && payment > 0) {
      console.error('ERROR: `payment` should be a positive integer value.');
      process.exit(1);
    }
    if (!zxutils.isNumber(guarantee) && guarantee > 0) {
      console.error('ERROR: `guarantee` should be a positive integer value.');
      process.exit(1);
    }
    if (!zxutils.isNumber(duration) && duration > 0) {
      console.error('ERROR: `duration` should be a positive integer value.');
      process.exit(1);
    }

    try {
      await zxagent.ensure(options.config);

      const contract = await zxagent.create(
        address, filename, payment, guarantee, duration * 1000
      );

      console.log('INFO: %s', chalk.green('Contract created!'));
      console.log(
        'INFO:     contract address: %s',
        chalk.green(contract.options.address)
      );
    } catch (error) {
      console.error(
        'ERROR: Failed to deploy transaction with error: `%s`.',
        error
      );
    }
  });

program
  .command('compcreate <provider_address> <payment> <guarantee> <duration>')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (address, payment, guarantee, duration, options) => {
    if (!zxutils.isNumber(payment) && payment > 0) {
      console.error('ERROR: `payment` should be a positive integer value.');
      process.exit(1);
    }
    if (!zxutils.isNumber(guarantee) && guarantee > 0) {
      console.error('ERROR: `guarantee` should be a positive integer value.');
      process.exit(1);
    }
    if (!zxutils.isNumber(duration) && duration > 0) {
      console.error('ERROR: `duration` should be a positive integer value.');
      process.exit(1);
    }

    try {
      await zxagent.ensure(options.config);

      const contract = await zxagent.compcreate(
        address, payment, guarantee, duration * 1000
      );

      console.log('INFO: %s', chalk.green('Contract created!'));
      console.log(
        'INFO:     contract address: %s',
        chalk.green(contract.options.address)
      );
    } catch (error) {
      console.error(
        'ERROR: Failed to deploy transaction with error: `%s`.',
        error
      );
    }
  });

program
  .command('cancel <address>')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (address, options) => {
    await zxagent.ensure(options.config);

    try {
      await zxagent.cancel(address);
    } catch(error) {
      zxutils.logError(error, true);
    }

    console.log(
      'INFO: Cancelled contract with address: ' + address + ' (probably).'
    );
  });

program
  .command('activate <address> <filename>')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (address, filename, options) => {
    await zxagent.ensure(options.config);
    await zxagent.activate(address, filename);
  });

program
  .command('invalidate <address>')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (address, options) => {
    await zxagent.ensure(options.config);
    await zxagent.invalidate(address);
  });

program
  .command('complete <address> <filename>')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (address, filename, options) => {
    await zxagent.ensure(options.config);
    await zxagent.complete(address, filename);
  });

program
  .command('deploy')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (options) => {
    try {
      await zxagent.ensure(options.config);

      await zxagent.deploy();
    } catch(_) {
      // Errors should be already logged.
    }
  });

program
  .command('serve <filename>')
  .action(async (filename) => {
    await zxagent.register(filename);
    await zxserver.listen(zxconf.SERVER_MODE.STANDALONE);
  });

program
  .command('upload <URL> <filename>')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (url, filename) => {
    try {
      await zxagent.upload(url, filename);
    } catch(_) {
      // Errors are already logged.
    }
  });

program
  .command('register <uploads-url> <challenge-url>')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (uploadsUrl, challengeUrl, options) => {
    try {
      await zxagent.ensure(options.config);
      await zxagent.register(uploadsUrl, challengeUrl);

      console.log('URL registered succesfully.');
    } catch(error) {
      console.error(
        'ERROR: Failed to register provider Url with error: `%s`.',
        error
      );
    }
  });

program
  .command('daemon')
  .option('-c, --config <path>', 'Specify configuration file.')
  .option('-h, --host <host>', 'Specify the host to listen to.')
  .option('-p, --port <port>', 'Specify the port to listen to.')
  .action(async (options) => {
    try {
      await zxagent.ensure(options.config);

      await zxserver.listen(
        zxconf.SERVER_MODE.DAEMON,
        options.host,
        options.port,
      );
    } catch (_) {
      // Errors are already logged.
    }
  });

program
  .command('auction <storage/compute> <filesize> <duration>')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (storage_or_compute, filesize, duration, options) => {
    if (!zxutils.isNumber(duration) && duration > 0) {
      console.error('ERROR: `duration` should be a positive integer value.');
      process.exit(1);
    }

    if (storage_or_compute === 'storage') {
      try {
        await zxagent.ensure(options.config);

        const _contract = await zxagent.newStorageAuction(
          filesize, duration * 1000
        );

        console.log('INFO: %s', chalk.green('Auction created!'));
      } catch (error) {
        console.error(
          'ERROR: Failed to create auction with error: `%s`.',
          error
        );
      }
    }
  });


program
  .command('test')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (options) => {
    try {
      await zxagent.ensure(options.config);

      const auctions = await zxagent.getStorageAuctions();

      console.log(auctions);

      console.log(await zxagent.getAuction(auctions[0]));
    } catch(error) {
      console.error(error);
      // Errors should be already logged.
    }
  });

program
  .command('resetdb')
  .option('-c, --config <path>', 'Specify configuration file.')
  .action(async (options) => {
    try {
      await zxagent.ensure(options.config);

      zxdb.resetDb();
    } catch(_) {
      // Errors should be already logged.
    }
  });

program.parse(process.argv);

if (process.argv.length == 2) {
  console.log('\n    ' + chalk.yellow('Sweet Sugar...') + '\n');
}
