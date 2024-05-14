//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import './CrossToken.sol';

contract CrossDestination{
    mapping(address => uint256) public balance;
    mapping(address => uint256) public locked; 
    address bridge;
    CrossToken public crossToken;

    constructor(address crossTokenAddress){
        bridge = msg.sender;
        crossToken = CrossToken(crossTokenAddress);
    }

    event CrossChainTransaction(uint amount, address source, address destination);

    function deposit(uint amount) external returns (uint256) {
        crossToken.transferFrom(msg.sender, address(this), amount);
        balance[msg.sender] = balance[msg.sender] + amount;
        return balance[msg.sender];
    }

    function withdraw(uint amount) external returns (uint remainingBalance) {
        if (amount <= balance[msg.sender]) {
            balance[msg.sender] -= amount;
            crossToken.transfer(msg.sender, amount);
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
            crossToken.burnToken(amount);
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
            crossToken.issueToken(address(this), amount);
            balance[destination] += amount;
        }
    }
}