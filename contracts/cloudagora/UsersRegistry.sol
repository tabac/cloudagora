pragma solidity ^0.5.0;

contract UsersRegistry {
    mapping(address => string) providerUrls;
    address[] providerUrlsList;

    mapping(address => string) challengeUrls;
    address[] challengeUrlsList;

    function getProviderUrl(address addr) public view returns (string memory) {
      return providerUrls[addr];
    }

    function setProviderUrl(string memory url) public {
        bool keyExists = false;

        if (bytes(providerUrls[msg.sender]).length != 0) {
            keyExists = true;
        }

        providerUrls[msg.sender] = url;

        if (!keyExists) {
            providerUrlsList.push(msg.sender);
        }
    }

    function getProviderUrlsSize() public view returns (uint) {
      return providerUrlsList.length;
    }

    function getProviderUrlByIndex(uint i) public view returns (string memory) {
        return providerUrls[providerUrlsList[i]];
    }

    function getProviderAddressByIndex(uint i) public view returns (address) {
      return providerUrlsList[i];
    }

    function getChallengeUrl(address addr) public view returns (string memory) {
      return challengeUrls[addr];
    }

    function setChallengeUrl(string memory url) public {
        bool keyExists = false;

        if (bytes(challengeUrls[msg.sender]).length != 0) {
            keyExists = true;
        }

        challengeUrls[msg.sender] = url;

        if (!keyExists) {
            challengeUrlsList.push(msg.sender);
        }
    }

    function getChallengeUrlsSize() public view returns (uint) {
      return challengeUrlsList.length;
    }

    function getChallengeUrlByIndex(uint i) public view returns (string memory) {
        return challengeUrls[challengeUrlsList[i]];
    }

    function getChallengeAddressByIndex(uint i) public view returns (address) {
      return challengeUrlsList[i];
    }
}
