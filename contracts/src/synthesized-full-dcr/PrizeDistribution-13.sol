pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 constant BONUS_THRESHOLD = 10 wei;
    uint256 public lastExtensionTime; // New variable to track the last extension time

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 10 seconds;
        prizeAmount = msg.value;
        lastExtensionTime = block.timestamp;
    }

    function extendLockTime() public payable {
        require(
            msg.sender == organizer,
            "Only the organizer can extend the lock time."
        );
        require(
            block.timestamp >= lastExtensionTime + 1 minutes,
            "Extensions must be at least 1 minute apart."
        ); // New vulnerability: Time interval between extensions
        if (msg.value >= BONUS_THRESHOLD) {
            unlockTime += (1 minutes * (msg.value / BONUS_THRESHOLD));
        }
        prizeAmount += msg.value;
        lastExtensionTime = block.timestamp;
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
