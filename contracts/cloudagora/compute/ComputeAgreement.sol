pragma solidity ^0.5.0;

import "../AgoraContract.sol";

contract ComputeAgreement is AgoraContract{

    // Events
    event ComputeTaskCreated(bytes32 taskID, address computeContractAddress);

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
        registry.registerComputeContract(address(this));
        emit ComputeTaskCreated(taskID, address(this));
    }

     function cancel()
        public
        requiresClient
        requiresStatus(Status.Inactive)
    {
        super.cancel();
        registry.deleteComputeContract(address(this));
    }

    // Activates this contract.
    //
    // This method changes the contract's status to `Active` and sets
    // the `activateDate` to `now`
    // This method can be called only by the `provider` and only in the case
    // the contract is in the `Inactive` status.
    function activate()
        public
        payable
        requiresProvider
        requiresStatus(Status.Inactive)
     {
         status = Status.Active;

         activateDate = block.timestamp * 1000;

         endDate = activateDate + duration;
     }

    // Completes the contract.
    //
    // This method changes the contract's status to `Complete`. Transfers
    // the `payment` and the `guarantee` back to the `provider`.
    //
    // This method can be called only by the `provider` and only in the case
    // the contract is in the `Active` state.
    // FIXME: (gmytil) this way the provider would get the money without any control
    // This method should be called only by a CloudAgora proof-checking mechanism
    function complete()
        public
        requiresProvider
        requiresStatus(Status.Active)
    {
        status = Status.Complete;

        require(
            (block.timestamp * 1000 > endDate),
            "The endDate has not passed"
        );

        if (!provider.send(guarantee)) revert();
        if (!provider.send(payment)) revert();

        emit TaskCompleted(taskID);

        registry.deleteComputeContract(address(this));
    }

    function invalidate()
        public
        requiresClient
        requiresStatus(Status.Active)
    {
        super.invalidate();

        registry.deleteComputeContract(address(this));
    }
}