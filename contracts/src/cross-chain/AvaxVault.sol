pragma solidity ^0.8.20;

interface AvaxRouter {
    function avax_payOut(
        address payable to,
        address asset,
        uint amount,
        string memory memo
    ) external payable;
}

contract AvaxVault {
    address owner;
    AvaxRouter routerContract;

    constructor(address _routerContract) {
        owner = msg.sender;
        routerContract = AvaxRouter(_routerContract);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner of this contract can call this function");
        _;
    }

    //Receive funds when msg.data is empty
    receive() external payable {}

    //Receive funds when msg.data is not empty
    fallback() external payable {}

    function fund() external payable {}

    function avax_bridgeForwards(
        address payable to,
        address asset,
        uint amount,
        string memory memo
    ) external onlyOwner {
        require(
                address(this).balance >= amount,
                "Vault has insufficient funds"
            );
            routerContract.avax_payOut{value: amount}(
                to,
                asset,
                amount,
                memo
            );
    }

    function avax_bridgeForwardsERC20(
        address payable to,
        address asset,
        uint amount,
        string memory memo
    ) external onlyOwner {
        routerContract.avax_payOut(to, asset, amount, memo);
    }
}
