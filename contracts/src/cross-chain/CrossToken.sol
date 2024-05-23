//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CrossToken is ERC20 {
    address owner;
    constructor() ERC20("CrossToken", "CT") {
        //_mint(msg.sender, 1000*10**18);
        owner = msg.sender;
    }

    //Relinquish ownership to
    function changeOwner(address newOwner) public {
        if (msg.sender == owner) {
            owner = newOwner;
        }
    }

    function issueToken(address destination, uint amount) public {
        if (msg.sender == owner) {
            _mint(destination, amount);
        }
    }

    function burnToken(uint amount) public {
        _burn(msg.sender, amount);
    }

    //For testing purposes, would not be in actual deployed token
    function testToken(uint amount) public {
        _mint(msg.sender, amount);
    }
}
