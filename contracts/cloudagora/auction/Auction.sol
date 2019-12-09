pragma solidity ^0.5.0;

import "./AuctionFactory.sol";
import "../AgoraContract.sol";
import "../compute/ComputeAgreement.sol";
import "../storage/StorageAgreement.sol";

contract Auction {

    address private auctionFactory;
    address private contractsRegistry;

    address public owner;
    bytes32 public taskID;
    bool public computeTask;
    uint public startTime;
    uint public auctionDeadline;
    uint public duration;

    address public agoraContract;

    bool public canceled;
    bool public finalized;
    uint public lowestOffer;
    address public winningBidder;
    mapping(address => uint256) public fundsByBidder;

    event NewOffer(address bidder, uint lowestOffer);
    event AuctionCanceled(bytes32 taskID);
    event AuctionFinalized(bytes32 taskID);

    constructor (
        address _owner,
        bytes32 _taskID,
        bool _computeTask,
        uint _initialOffer,
        uint _startTime,
        uint _duration,
        address _auctionFactory,
        address _contractsRegistry
    ) public {
        require(
            _owner != address(0x0),
            "Must provide an auction owner."
        );

        auctionFactory = _auctionFactory;
        contractsRegistry = _contractsRegistry;
        auctionDeadline = (now + 360) * 1000;
        owner = _owner;
        taskID = _taskID;
        computeTask = _computeTask;
        lowestOffer = _initialOffer;
        startTime = _startTime;
        duration = _duration;
    }

    function placeOffer(uint newOffer) public
        //payable
        onlyAfterStart
        onlyBeforeEnd
        onlyNotCanceled
        onlyNotOwner
        returns (bool success)
    {
        require(
            newOffer < lowestOffer,
            "A new offer should be better than the current best."
        );

        fundsByBidder[msg.sender] = newOffer;
        lowestOffer = newOffer;
        winningBidder = msg.sender;

        emit NewOffer(msg.sender, lowestOffer);

        return true;
    }

    function cancelAuction() public
        onlyOwner
        onlyBeforeEnd
        onlyNotCanceled
        returns (bool success)
    {
        canceled = true;

        emit AuctionCanceled(taskID);

        // delete auction from the registry of the auctionFactory
        // deleteFromRegistry();

        return true;
    }

    function finalize() public
        payable
        onlyOwner
        onlyNotFinalized
        onlyNotCanceled
        returns(address)
    {
        require(
            winningBidder != address(0x0),
            "There must be a winning bidder to finalize the auction."
        );

        uint collateral = computeCollateral();

        if(computeTask){
            ComputeAgreement agc = (new ComputeAgreement).value(lowestOffer)
                    (taskID,
                    address(uint160(owner)),
                    address(uint160(winningBidder)),
                    lowestOffer,
                    collateral,
                    duration,
                    contractsRegistry);

            agoraContract = address(agc);
        }else{
            StorageAgreement ags = (new StorageAgreement).value(lowestOffer)
                    (taskID,
                    address(uint160(owner)),
                    address(uint160(winningBidder)),
                    lowestOffer,
                    collateral,
                    duration,
                    contractsRegistry);

            agoraContract = address(ags);
        }

        // delete auction from the registry of the auctionFactory
       // deleteFromRegistry();
       finalized = true;
        emit AuctionFinalized(taskID);

        return agoraContract;
    }

    function computeCollateral() private view returns(uint)
    {
        return lowestOffer * 10;
    }

    function deleteFromRegistry() private
    {
        AuctionFactory factory = AuctionFactory(auctionFactory);
        if(computeTask){
            factory.removeComputeAuction(address(this));
        }else{
            factory.removeStorageAuction(address(this));
        }
    }

    modifier onlyOwner {
        require(
            msg.sender == owner,
            "This action must be performed by the auction owner."
        );
        _;
    }

    modifier onlyNotOwner {
        require(
            msg.sender != owner,
            "This action must not be performed by the auction owner."
        );
        _;
    }

    modifier onlyAfterStart {
        require(
            now * 1000 >= startTime,
            "This action must be performed after the auction startTime."
        );
        _;
    }

    modifier onlyBeforeEnd {
        require(
            now * 1000 <= auctionDeadline,
            "This action must be performed before the auction EndTime."
        );
        _;
    }

    modifier onlyNotCanceled {
        require(
            !canceled,
            "This action cannot be performed on a canceled auction."
        );
        _;
    }

    modifier onlyNotFinalized {
        require(
            !finalized,
            "This action cannot be performed on a finalized auction."
        );
        _;
    }

    modifier onlyEndedOrCanceled {
        require(
            now * 1000 >= auctionDeadline || canceled,
            "This action must be performed after the auction end."
        );
        _;
    }
}
