pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 public lastGasPrice;
    uint256 constant GAS_PRICE_THRESHOLD = 50 gwei; // Example threshold for high gas price

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 10 seconds;
        prizeAmount = msg.value;
        lastGasPrice = tx.gasprice;
    }

    function adjustPrizeBasedOnCongestion() public payable {
        require(
            msg.sender == organizer,
            "Only the organizer can adjust prize based on congestion."
        );

        if (tx.gasprice > lastGasPrice && tx.gasprice > GAS_PRICE_THRESHOLD) {
            prizeAmount += msg.value;
            unlockTime -= 1 minutes; // Reduce unlock time unexpectedly due to high gas price
        } else {
            prizeAmount -= msg.value / 10; // Minor penalty for low gas price adjustments
        }

        lastGasPrice = tx.gasprice; // Update last known gas price
    }

    function claimPrize() public {
        require(
            msg.sender == beneficiary,
            "Only the beneficiary can claim the prize."
        );
        require(block.timestamp >= unlockTime, "Prize is still locked.");
        payable(beneficiary).transfer(prizeAmount);
        prizeAmount = 0;
    }

    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }
}
