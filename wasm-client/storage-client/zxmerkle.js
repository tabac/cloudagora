'use strict';

const fs = require('fs');
const keccak = require('keccak');
const MerkleTree = require('merkletreejs');

const zxconf = require('./zxconf.js');

// Return the keccak256 digest for `data`.
function keccak256(data) {
  return keccak('keccak256').update(data).digest();
}

// Read a file asynchronously and return a Promise.
//
// This reads the entire file in a buffer.
async function readFile(filename) {
  return new Promise(function (resolve, reject) {
    try {
      fs.readFile(filename, (error, buffer) => {
        if (error) {
          reject(error);
        } else {
          resolve(buffer);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function getBlocksCount(filesize) {
  return Math.ceil(filesize / zxconf.BLOCK_SIZE);
}

// Creates a Merkle tree from the contents of the file with `filename`.
//
// Reads the entire file in a buffer and creates a Merkle tree from
// blocks of the file's content. The block size is `zxconf.BLOCK_SIZE`.
//
// TODO: Should not read the entire file into memory. Instead we should
//       read it as a stream and create the hashed leaves in the process.
//       Start from `fs.createReadStream` and go from there.
async function create(filename, block = null) {
  // Read input file into buffer.
  let buffer = null;

  try {
    buffer = await readFile(filename);
  } catch(error) {
    Promise.reject(error);
  }

  // TODO: Too many variables and counters here...
  let i = null;
  let blocks = getBlocksCount(buffer.length);

  let sourceStart = null, sourceEnd = null;

  let leaves = [];
  let bucket = Buffer.alloc(zxconf.BLOCK_SIZE);

  // Create Merkle tree leafs from blocks of the file's contents.
  for (i = 0; i < blocks - 1; i++) {
    sourceStart = i * zxconf.BLOCK_SIZE;
    sourceEnd = Math.min((i + 1) * zxconf.BLOCK_SIZE, buffer.length);

    buffer.copy(bucket, 0, sourceStart, sourceEnd);

    leaves.push(keccak256(bucket));
  }

  // Deal with the last leaf. It may have size `< zxconf.BLOCK_SIZE`.
  sourceStart = i * zxconf.BLOCK_SIZE;
  sourceEnd = Math.min((i + 1) * zxconf.BLOCK_SIZE, buffer.length);

  bucket = Buffer.alloc(sourceEnd - sourceStart);

  buffer.copy(bucket, 0, sourceStart, sourceEnd);

  leaves.push(keccak256(bucket));

  let result = {
    tree: new MerkleTree(leaves, keccak256),
    leaf: null,
  };

  // If a block index is specified return its contents.
  if (block !== null && block < blocks) {
    sourceStart = block * zxconf.BLOCK_SIZE;
    sourceEnd = Math.min((block + 1) * zxconf.BLOCK_SIZE, buffer.length);

    result.leaf = Buffer.alloc(sourceEnd - sourceStart);

    buffer.copy(result.leaf, 0, sourceStart, sourceEnd);
  }

  return Promise.resolve(result);
}

// Creates a Merkle tree proof for the `tree` and `leaf` at `index`.
//
// Returns the proof as it will be passed to the library.
async function prove(tree, leaf, index) {
  // Create the Merkle tree proof.
  const proof = tree.getProof(keccak256(leaf), index);

  // Reformat proof to match library arguments.
  let hashes = [], orientations = [];

  proof.map(e => {
    hashes.push(e.data);
    orientations.push((e.position == 'left'));
  });

  const result = {
    'root': tree.getRoot(),
    'leaf': leaf,
    'hashes': hashes,
    'orientations': orientations,
  };

  return Promise.resolve(result);
}

// Parses JSON into a Merkle Proof object.
async function parseJSON(proofJSON) {
  let proof = null;
  try {
    proof = JSON.parse(proofJSON);
  } catch(error) {
    console.error(
      'ERROR: Failed to JSON.parse proof with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  let result = null;
  try {
    result = {
      root: Buffer.from(proof.root),
      leaf: Buffer.from(proof.leaf),
      hashes: proof.hashes.map(hash => Buffer.from(hash)),
      orientations: proof.orientations,
    };
  } catch(error) {
    console.error(
      'ERROR: Failed to JSON.parse proof with error: `%s`.', error
    );
    return Promise.reject(error);
  }

  return Promise.resolve(result);
}

// Compares two Merkle proofs for equality.
function compare(leftProof, rightProof) {
  if (!leftProof.root.equals(rightProof.root)) {
    return false;
  }
  if (!leftProof.leaf.equals(rightProof.leaf)) {
    return false;
  }
  if (leftProof.hashes.length != rightProof.hashes.length) {
    return false;
  }

  for (let i = 0; i < leftProof.hashes.length; i++) {
    if (!leftProof.hashes[i].equals(rightProof.hashes[i])) {
      return false;
    }
    if (leftProof.orientations[i] != rightProof.orientations[i]) {
      return false;
    }
  }

  return true;
}

module.exports = {
  prove: prove,
  create: create,
  compare: compare,
  parseJSON: parseJSON,
  getBlocksCount: getBlocksCount,
};
