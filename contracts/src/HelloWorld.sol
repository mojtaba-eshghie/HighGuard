pragma solidity ^0.8.0;

contract HelloWorld {
    string public greet = "Hello World!";

    function setGreet(string memory greet_) public {
        greet = greet_;
    }

    function getGreeted() public returns (string memory) {
        return greet;
    }
}
