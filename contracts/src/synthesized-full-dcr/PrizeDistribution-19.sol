pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 constant BONUS_THRESHOLD = 10 wei;
    uint256 public constant MAX_LOCK_DURATION = 1 hours; // New state variable for max lock duration

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
        require(
            unlockTime + (1 minutes * (msg.value / BONUS_THRESHOLD)) <=
                block.timestamp + MAX_LOCK_DURATION,
            "Lock duration cannot exceed max limit"
        ); // New vulnerability: Max lock duration
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
        payable(beneficiary).transfer(prizeAmount);
        prizeAmount = 0;
    }

    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }
}
