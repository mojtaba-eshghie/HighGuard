//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract CrossSource{
    mapping(address => uint256) public balance;
    mapping(address => uint256) public locked; 
    address bridge;

    constructor(){
        bridge = msg.sender;
    }

    event CrossChainTransaction(uint amount, address source, address destination);

    function deposit() external payable returns (uint256) {
        balance[msg.sender] = balance[msg.sender] + msg.value;
        return balance[msg.sender];
    }

    function withdraw(uint amount) external returns (uint remainingBalance) {
        if (amount <= balance[msg.sender]) {
            balance[msg.sender] -= amount;
            payable(msg.sender).transfer(amount);
        }
        return balance[msg.sender];
    }

    function toCrossChain(uint amount, address destination) external {
        if(balance[msg.sender] >= amount) {
            balance[msg.sender] -= amount;
            locked[msg.sender] += amount;
            emit CrossChainTransaction(amount, msg.sender, destination);
        }
    }

    function crossChainSuccess(uint amount, address from) external {
        if (msg.sender == bridge && locked[from] >= amount) {
            locked[from] -= amount;
        }
    }

    function crossChainFailure(uint amount, address from) external {
        if(msg.sender == bridge && locked[from] >= amount) {
            locked[from] -= amount;
            balance[from] += amount;
        }
    }

    function fromCrossChain(uint amount, address destination) external {
        if(msg.sender == bridge) {
            balance[destination] += amount;
        }
    }
}