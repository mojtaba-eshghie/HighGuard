pragma solidity ^0.8.20;

interface EthRouter {
    function eth_payOut(
        address payable to,
        address asset,
        uint amount,
        string memory memo
    ) external payable;
}

interface Oracle {
    function getExchangeRate(uint amount, string memory sourceAsset, string memory targetAsset) external view returns (uint);
    function getPrice(string memory asset) external view returns (uint256);
}

contract EthVaultOracle {
    address owner;
    EthRouter routerContract;
    Oracle oracleContract;

    constructor(address _routerContract, address _oracleContract) {
        owner = msg.sender;
        routerContract = EthRouter(_routerContract);
        oracleContract = Oracle(_oracleContract);
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

    function eth_bridgeForwards(
        address payable to,
        address asset,
        uint amountPaid,
        string memory sourceAsset,
        string memory memo
    ) external onlyOwner {
            uint amount = (oracleContract.getPrice(sourceAsset) * amountPaid)/1000;
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
    }

    function eth_bridgeForwardsERC20(
        address payable to,
        address asset,              //actual address of asset
        uint amountPaid,
        string memory sourceAsset,
        string memory targetAsset,//has format ETH.0x12341...
        string memory memo
    ) external onlyOwner {
        uint amount = oracleContract.getExchangeRate(amountPaid, sourceAsset, targetAsset);
        routerContract.eth_payOut(to, asset, amount, memo);
    }
}
