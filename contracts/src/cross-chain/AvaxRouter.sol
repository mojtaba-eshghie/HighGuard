pragma solidity ^0.8.20;

interface iERC20 {
    function balanceOf(address) external view returns (uint256);
    function burn(uint256) external;
    function transferFrom(address, address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool success);
}

contract AvaxRouter {
    //This keeps track of bridge-owned token, is burned
    address public CrossToken;

    //Keeps track of how many of each token that belongs to the vault vaultAllowance[vault][memo]
    mapping(address => mapping(address => uint)) private vaultAllowance;

    //Variable to keep track if function has been entered before forr reentrancy guard
    bool private entered;

    //Checks for reentrancy
    modifier reentrancyGuard() {
        require(!entered, "Reentrancy not allowed");
        entered = true;
        _;
        entered = false;
    }

    constructor(address crosstoken) {
        CrossToken = crosstoken;
        entered = false;
    }

    //Memo has format: PAYLOAD:CHAIN.ASSET:DESTADDR
    //ex for transferring to ETH chain with Eth asset to address:
    // SWAP:ETH.ETH:0xe6a30f4f3bad978910e2cbb4d97581f5b5a0ade0

    //ex for adding liquidity to a vault:
    //ADD:_._:_

    event Deposit(
        address indexed from,
        address indexed to,
        address indexed asset,
        uint amount,
        string memo
    );

    event PayOut(
        address indexed vault,
        address indexed to,
        address asset,
        uint amount,
        string memo
    );

    //Used to deposit funds into a vault controlled by the relay
    function avax_deposit(
        address payable vault,
        address asset,
        uint amount,
        string memory memo
    ) public payable reentrancyGuard {
        uint depositAmount;
        if (asset == address(0)) {
            //If native token
            depositAmount = msg.value;
            bool success = vault.send(depositAmount);
            require(success, "Could not send native cryptocurrency to address");
        }
        /* else if (asset == CrossToken){  //If token we can mint and burn
            require(msg.value == 0, "Native cryptocurrency recieved along with CrossToken");
            depositAmount = amount;
            iERC20(CrossToken).transferFrom(msg.sender, address(this), depositAmount);
            iERC20(CrossToken).burn(depositAmount);
        } */
        else {
            //If ERC20 token
            require(
                msg.value == 0,
                "Native cryptocurrency recieved along with ERC20"
            );
            depositAmount = amount;
            recieveERC20(msg.sender, asset, depositAmount);
            vaultAllowance[vault][asset] += depositAmount;
        }
        emit Deposit(msg.sender, vault, asset, depositAmount, memo);
    }

    function depositWithExpiry(
        address payable vault,
        address asset,
        uint amount,
        string memory memo,
        uint expiration
    ) external payable {
        require(block.timestamp < expiration, "Deposit request expired");
        avax_deposit(vault, asset, amount, memo);
    }

    //Called by a vault to pay out funds to indicated address
    function avax_payOut(
        address payable to,
        address asset,
        uint amount,
        string memory memo
    ) public payable reentrancyGuard {
        uint payAmount;
        if (asset == address(0)) {
            payAmount = msg.value;
            bool success = to.send(payAmount);
            require(success, "Could not pay out native cryptocurrency");
        } else {
            payAmount = amount;
            require(
                vaultAllowance[msg.sender][asset] >= payAmount,
                "ERC20 amount exceeds allowance"
            );
            sendERC20(to, asset, payAmount);
            vaultAllowance[msg.sender][asset] -= payAmount;
        }
        emit PayOut(msg.sender, to, asset, payAmount, memo);
    }

    //Helper Functions

    //Withdraws specified amount of specified ERC20 from address
    //The payer needs to approve the transaction beforehand
    function recieveERC20(address from, address asset, uint amount) internal {
        bool success = iERC20(asset).transferFrom(from, address(this), amount);
        require(success, "Could not take receive ERC20 tokens");
    }

    //Sends specified amount of specified ERC20 to address
    function sendERC20(
        address payable to,
        address asset,
        uint amount
    ) internal {
        bool success = iERC20(asset).transfer(to, amount);
        require(success, "Could not transfer ERC20 to specified address");
    }
}
