'use strict';

const zxconf = require('./zxconf.js');

// Returns `true` if `n` can be considered a number.
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

// Logs an error message and optionally exits.
function logError(error, exit = false) {
  if (zxconf.DEBUG) {
    console.error(error);
  } else {
    console.error(error.message);
  }

  if (exit) {
    process.exit(1);
  }
}

// Returns a deep copy of `obj`.
function copy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function statusDescription(statusCode) {
  let result = 'Uknown';

  if (statusCode == 0) {
    result = 'Inactive';
  } else if (statusCode == 1) {
    result = 'Cancelled';
  } else if (statusCode == 2) {
    result = 'Active';
  } else if (statusCode == 3) {
    result = 'Complete';
  } else if (statusCode == 4) {
    result = 'Invalid';
  }

  return result;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max + 1));
}

module.exports = {
  copy: copy,
  logError: logError,
  isNumber: isNumber,
  getRandomInt: getRandomInt,
  statusDescription: statusDescription,
};
