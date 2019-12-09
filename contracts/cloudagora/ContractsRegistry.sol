pragma solidity ^0.5.0;

contract ContractsRegistry{

    address[] public storageContracts;
    address[] public computeContracts;

    function registerStorageContract(address scontract) public
    {
        storageContracts.push(scontract);
    }

    function registerComputeContract(address ccontract) public
    {
        computeContracts.push(ccontract);
    }

    function deleteStorageContract(address scontract) public returns(bool)
    {
        uint selectedIndex;
        uint l = storageContracts.length;
        for(uint i = 0; i < l; i++){
            if(storageContracts[i] == scontract){
                selectedIndex = i;
                break;
            }
        }
        delete storageContracts[selectedIndex];
        //FIXME: shift element for eleiminating gaps after deletion
        return true;
    }

    function deleteComputeContract(address ccontract) public returns(bool)
    {
        uint selectedIndex;
        uint l = computeContracts.length;
        for(uint i = 0; i < l; i++){
            if(computeContracts[i] == ccontract){
                selectedIndex = i;
                break;
            }
        }
        delete computeContracts[selectedIndex];
        //FIXME: shift element for eleiminating gaps after deletion
        return true;
    }
}
