pragma solidity ^0.5.0;

import "./ContractsRegistry.sol";

// Functionality of a generic task contract in CloudAgora
// An AgoraContract can be either a ComputeAgreement or a StorageSupply contract
contract AgoraContract {
    // Enum of the possible status values
    // a CloudAgora contract can have.
    enum Status {
        Inactive,
        Cancelled,
        Active,
        Complete,
        Invalid
    }

    // Grace period after `endDate` for the provider
    // to `complete` the contract.
    // After `endDate + gracePeriod` the client can invalidate
    // the contract and get his payment back.
    uint constant gracePeriod = 86400000;

    // unique identifier of the specific task
    bytes32 internal taskID;
    // Address of the client.
    address payable internal client;
    // Address of the service provider.
    address payable internal provider;
    // Agreed payment for the task.
    uint internal payment;
    // Amount that the provider puts as a collateral.
    uint internal guarantee;
    // Storage contract duration (in ms).
    uint internal duration;
    // Contract activation date (in ms since epoch)
    uint internal activateDate;
    // Contract deadline (in ms since epoch).
    uint internal endDate;
    // Contract status.
    Status internal status;

    // Address of smart contract that stores all active CloudAgora contracts
    address public contractsRegistry;
    ContractsRegistry internal registry;

    // Events
    event TaskCompleted(bytes32 taskID);
    event TaskCancelled(bytes32 taskID);
    event TaskInvalidated(bytes32 taskID);

    // Modifiers.
    modifier requiresClient() {
        require(
            msg.sender == client,
            "Only client can call this method."
        );
        _;
    }

    modifier requiresProvider() {
        require(
            msg.sender == provider,
            "Only provider can call this method."
        );
        _;
    }

    modifier requiresStatus(Status _status) {
        require(
            status == _status,
            "Invalid status."
        );
        _;
    }

    // Contract constructor.
    constructor(
        bytes32 _taskID,
        address payable _client,
        address payable _provider,
        uint _payment,
        uint _guarantee,
        uint _duration,
        address _contractsRegistry
    ) 
        public 
        payable 
    {
        require(
            msg.value == _payment,
            "Trabsferred value is not equal to the one agreed."
        );

        require(
            _guarantee >= _payment,
            "For security reasons, the guarantee should be greater than the agreed task price."
        );

        taskID = _taskID;

        client = _client;
        provider = _provider;
        payment = _payment;
        guarantee = _guarantee;
        duration = _duration;

        status = Status.Inactive;

        contractsRegistry = _contractsRegistry;
        registry = ContractsRegistry(contractsRegistry);
    }

    // Cancels this contract.
    //
    // This method changes the contract's status to `Inactive` and refunds
    // the payment to the `client`.
    //
    // This method can be called only by the `client` and only in the case
    // the contract has not been activated by the `provider`. In that case
    // the `client`'s payment is refunded.
    function cancel()
        public
        requiresClient
        requiresStatus(Status.Inactive)
    {
        status = Status.Cancelled;

        msg.sender.transfer(address(this).balance);
    }

    // Invalidates the contract.
    //
    // This method changes the contract's status to `Invalid`. Transfers
    // the `payment` and the `guarantee` to the `client`. This is run by
    // the `client` in the case `endDate` is passed and the contract
    // is not `complete` by the `provider`.
    //
    // This method can be called only by the `client` and only in the case
    // the contract is in the `Active` state.
    function invalidate()
        public
        requiresClient
        requiresStatus(Status.Active)
    {
        require(
            (block.timestamp * 1000 > endDate + gracePeriod),
            "The grace period has not passed since `endDate`."
        );

        status = Status.Invalid;

        emit TaskInvalidated(taskID);
    }

    // Getters:

    function getTaskId() public view returns (bytes32) {
      return taskID;
    }

    function getClientAddress() public view returns (address) {
      return client;
    }

    function getProviderAddress() public view returns (address) {
      return provider;
    }

    function getPayment() public view returns (uint) {
      return payment;
    }

    function getGuarantee() public view returns (uint) {
      return guarantee;
    }

    function getDuration() public view returns (uint) {
      return duration;
    }

    function getActivateDate() public view returns (uint) {
      return activateDate;
    }

    function getEndDate() public view returns (uint) {
      return endDate;
    }

    function getStatus() public view returns (int8) {
        if (status == Status.Inactive) {
            return 0;
        } else if (status == Status.Cancelled) {
            return 1;
        } else if (status == Status.Active) {
            return 2;
        } else if (status == Status.Complete) {
            return 3;
        } else if (status == Status.Invalid) {
            return 4;
        } else {
            return -1;
        }
    }
}
