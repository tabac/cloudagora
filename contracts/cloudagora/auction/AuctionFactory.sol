pragma solidity ^0.5.0;

import "./Auction.sol";

contract AuctionFactory {

    address public contractsRegistry;

    address[] public storageAuctions;
    address[] public computeAuctions;

    event StorageAuctionCreated(address auctionContract, address owner, uint initialBid, uint duration);
    event ComputeAuctionCreated(address auctionContract, address owner, uint initialBid, uint duration);

    constructor(address _contractsRegistry) public
    {
        contractsRegistry = _contractsRegistry;
    }

    function createStorageAuction(
        bytes32 taskID,
        uint duration,
        uint256 fileSize
    )
        public
        returns (address)
    {
        uint256 cost = computeStorageCost(fileSize);
        uint initialBid = initialBidFromCost(cost);
        Auction newAuction = new Auction(
            msg.sender,
            taskID,
            false,
            initialBid,
            now * 1000,
            duration,
            address(this),
            contractsRegistry
        );

        storageAuctions.push(address(newAuction));

        emit StorageAuctionCreated(address(newAuction), msg.sender, initialBid, duration);

        return address(newAuction);
    }

    function createComputeAuction(
        bytes32 taskID,
        uint duration,
        uint256 requiredGas
    )
        public
        returns (address)
    {
        uint256 cost = computeComputeCost(requiredGas);
        uint initialBid = initialBidFromCost(cost);
        Auction newAuction = new Auction(
            msg.sender,
            taskID,
            true,
            initialBid,
            now * 1000,
            duration,
            address(this),
            contractsRegistry
        );

        computeAuctions.push(address(newAuction));

        emit ComputeAuctionCreated(address(newAuction), msg.sender, initialBid, duration);

        return address(newAuction);
    }

    function computeStorageCost(uint256 fileSize) private pure returns(uint256)
    {
        return fileSize * 10; //FIXME:  find a meaningful function
    }

    function computeComputeCost(uint256 requiredGas) private pure returns(uint256)
    {
        return requiredGas * 20; //FIXME: find a meaningful function
    }

    function initialBidFromCost(uint256 cost) private pure returns(uint){
        return cost / 10; //FIXME: find a meaningful function
    }

    function getAllStorageAuctions() public view returns (address[] memory)
    {
        return storageAuctions;
    }

    function getAllComputeAuctions() public view returns (address[] memory)
    {
        return computeAuctions;
    }

    function getStorageAuctionByIndex(uint idx) public view returns (address) {
      return storageAuctions[idx];
    }

    function getStorageAuctionsSize() public view returns (uint) {
      return storageAuctions.length;
    }

    function getComputeAuctionsSize() public view returns (uint) {
      return computeAuctions.length;
    }

    function getComputeAuctionByIndex(uint idx) public view returns (address) {
      return computeAuctions[idx];
    }

    function removeStorageAuction(address auction) public returns(bool)
    {
        uint selectedIndex;
        uint l = storageAuctions.length;
        for(uint i = 0; i < l; i++){
            if(storageAuctions[i] == auction){
                selectedIndex = i;
                break;
            }
        }
        delete storageAuctions[selectedIndex];
        //FIXME: shift element for eleiminating gaps after deletion
        return true;
    }

    function removeComputeAuction(address auction) public returns(bool)
    {
        uint selectedIndex;
        uint l = computeAuctions.length;
        for(uint i = 0; i < l; i++){
            if(computeAuctions[i] == auction){
                selectedIndex = i;
                break;
            }
        }
        delete computeAuctions[selectedIndex];
        //FIXME: shift element for eleiminating gaps after deletion
        return true;
    }
}