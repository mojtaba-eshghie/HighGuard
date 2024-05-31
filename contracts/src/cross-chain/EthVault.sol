pragma solidity ^0.8.20;

interface EthRouter {
    function eth_payOut(
        address payable to,
        address asset,
        uint amount,
        string memory memo
    ) external payable;
}

contract EthVault {
    address owner;
    EthRouter routerContract;

    constructor(address _routerContract) {
        owner = msg.sender;
        routerContract = EthRouter(_routerContract);
    }

    //Receive funds when msg.data is empty
    receive() external payable {}

    //Receive funds when msg.data is not empty
    fallback() external payable {}

    function fund() external payable {}

    function bridgeForwards(
        address payable to,
        address asset,
        uint amount,
        string memory memo
    ) external {
        if (msg.sender == owner) {
            if (asset == address(0)) {
                require(
                    address(this).balance >= amount,
                    "Vault has insufficient funds"
                );
                routerContract.eth_payOut{value: amount}(
                    to,
                    asset,
                    amount,
                    memo
                );
            } else {
                routerContract.eth_payOut(to, asset, amount, memo);
            }
        }
    }
}
