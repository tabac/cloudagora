pragma solidity ^0.5.0;

import "../AgoraContract.sol";

contract StorageAgreement is AgoraContract{

    // Storage contract file hash.
    bytes32 fileHash;

    // Events
    event StorageTaskCreated(bytes32 taskID, address storageContractAddress);

    constructor(
        bytes32 _taskID,
        address payable _client,
        address payable _provider,
        uint _payment,
        uint _guarantee,
        uint _duration,
        address _contractsRegistry
    ) AgoraContract(_taskID, _client, _provider, _payment, _guarantee, _duration, _contractsRegistry)
        public
        payable
    {
        registry.registerStorageContract(address(this));
        emit StorageTaskCreated(taskID, address(this));
    }

    function cancel()
        public
        requiresClient
        requiresStatus(Status.Inactive)
    {
        super.cancel();
        registry.deleteStorageContract(address(this));
    }

    // Activates this storage contract.
    //
    // This method changes the contract's status to `Active` and sets
    // the `activateDate` to `now` and the `endDate` to `now + duration`.
    //
    // This method can be called only by the `provider` and only in the case
    // the contract is in the `Inactive` status.
    function activate(
        bytes memory leaf,
        bytes32[] memory nodeHashes,
        bool[] memory nodeOrientations
    )
        public
        payable
        requiresProvider
        requiresStatus(Status.Inactive)
    {
        require(
            msg.value == guarantee,
            "Guarantee is not equal to transaction's balance."
        );

        require(
            verify(fileHash, leaf, nodeHashes, nodeOrientations),
            "The proof provided does not match the contract's root hash."
        );

        status = Status.Active;

        activateDate = block.timestamp * 1000;

        endDate = activateDate + duration;
    }

    // Completes the storage contract.
    //
    // This method changes the contract's status to `Complete`. Transfers
    // the `payment` and the `guarantee` back to the `provider`.
    //
    // This method can be called only by the `provider` and only in the case
    // the contract is in the `Active` state.
    function complete(
        bytes memory leaf,
        bytes32[] memory nodeHashes,
        bool[] memory nodeOrientations
    )
        public
        requiresProvider
        requiresStatus(Status.Active)
    {
        require(
            (block.timestamp * 1000 > endDate),
            "The endDate has not passed"
        );

        require(
            verify(fileHash, leaf, nodeHashes, nodeOrientations),
            "The proof provided does not match the contract's root hash."
        );

        status = Status.Complete;

        msg.sender.transfer(address(this).balance);

        emit TaskCompleted(taskID);

        registry.deleteStorageContract(address(this));
    }

    function invalidate()
        public
        requiresClient
        requiresStatus(Status.Active)
    {
        super.invalidate();

        registry.deleteStorageContract(address(this));
    }

    // Setters:

    function setFileHash(bytes32 _fileHash)
      public
      requiresClient
      payable
    {
      fileHash = _fileHash;
    }

    // Getters:

    function getFileHash() public view returns (bytes32) {
      return fileHash;
    }

    // Storage Proof Library code.

    // Size of a hash digest, in bytes.
    uint internal constant HASH_DIGEST_SIZE = 32;

    // Verifies a Merkle Tree Proof.
    function verify(
        bytes32 rootHash,
        bytes memory leaf,
        bytes32[] memory nodeHashes,
        bool[] memory nodeOrientations
    )
        public
        pure
        returns (bool)
    {
        if ((nodeHashes.length == 0) ||
            (nodeHashes.length != nodeOrientations.length)) {
            return false;
        }

        // Calculate the hash digest of the leaf node.
        bytes32 curHash = keccak256(leaf);

        bytes memory buffer = new bytes(2 * HASH_DIGEST_SIZE);

        uint bufAddr = dataPtr(buffer);

        // Verify that the given Merkle Tree Proof is valid
        // and leads to the provided `rootHash`.
        for (uint i = 0; i < nodeHashes.length; i++) {
            if (nodeOrientations[i]) {
                // This is a left child node.
                copyBytes32(bufAddr, nodeHashes[i]);
                copyBytes32(bufAddr + HASH_DIGEST_SIZE, curHash);
            } else {
                // This is a right child node.
                copyBytes32(bufAddr, curHash);
                copyBytes32(bufAddr + HASH_DIGEST_SIZE, nodeHashes[i]);
            }

            curHash = keccak256(buffer);
        }

        return (curHash == rootHash);
    }

    // Copies `bts` to the memory location pointer by `dst`.
    function copyBytes32(uint dst, bytes32 bts) internal pure {
        assembly {
            mstore(dst, bts)
        }
    }

    // Returns the memory address of the data portion of `bts`.
    //
    // Ref:
    //      https://github.com/ethereum/solidity-examples/blob/master/src/unsafe/Memory.sol
    function dataPtr(bytes memory bts) internal pure returns (uint addr) {
        assembly {
            addr := add(bts, /* BYTES_HEADER_SIZE */ 32)
        }
    }
}
