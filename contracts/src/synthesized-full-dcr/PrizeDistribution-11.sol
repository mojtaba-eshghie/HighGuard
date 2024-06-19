pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 constant BONUS_THRESHOLD = 10 wei;
    bool public isPrizeClaimed = false; // New state variable

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 10 seconds;
        prizeAmount = msg.value;
    }

    function extendLockTime() public payable {
        require(
            msg.sender == organizer,
            "Only the organizer can extend the lock time."
        );
        require(!isPrizeClaimed, "Prize already claimed."); // Prevent further extensions if prize is claimed
        if (msg.value >= BONUS_THRESHOLD) {
            unlockTime += (1 minutes * (msg.value / BONUS_THRESHOLD));
        }
        prizeAmount += msg.value;
    }

    function claimPrize() public {
        require(
            msg.sender == beneficiary,
            "Only the beneficiary can claim the prize."
        );
        require(block.timestamp >= unlockTime, "Prize is still locked.");
        require(!isPrizeClaimed, "Prize already claimed."); // Ensure prize can only be claimed once
        isPrizeClaimed = true;
        payable(beneficiary).transfer(prizeAmount);
        prizeAmount = 0;
    }

    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }
}
