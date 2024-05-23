pragma solidity ^0.8.20;

interface Router {
    function payOut(address payable to, address asset, uint amount, string memory memo) external payable;
}

contract Vault {
    address owner;
    Router routerContract;

    constructor(address _routerContract){
        owner = msg.sender;
        routerContract = Router(_routerContract);
    }

    //Receive funds when msg.data is empty
    receive() external payable {
    }

    //Receive funds when msg.data is not empty
    fallback() external payable {
    }

    function fund() external payable {
    }

    function bridgeForwards(address payable to, address asset, uint amount, string memory memo) external{
        if(msg.sender == owner){
            if(asset == address(0)){
                require(address(this).balance >= amount, "Vault has insufficient funds");
                routerContract.payOut{value: amount}(to, asset, amount, memo);
            } else {
                routerContract.payOut(to, asset, amount, memo);
            }
        }
    }
}