pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 constant BONUS_THRESHOLD = 10 wei; // If the organizer sends 0.1 ether or more, they get a bonus period

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 10 seconds;
        prizeAmount = msg.value; // Initial prize amount set by the organizer
    }

    function extendLockTime() public payable {
        require(
            msg.sender == organizer,
            "Only the organizer can extend the lock time."
        );
        // Incorrect implementation leading to potential reduction in unlock time
        if (msg.value >= BONUS_THRESHOLD) {
            uint256 additionalTime = (msg.value / BONUS_THRESHOLD) * 1 minutes;
            if (additionalTime > 5 minutes) {
                unlockTime -= additionalTime - 5 minutes; // Reduces unlock time if the calculated additional time is excessively high
            } else {
                unlockTime += additionalTime; // Normally increase unlock time
            }
        }
        prizeAmount += msg.value; // Increase the prize amount
    }

    function claimPrize() public {
        require(
            msg.sender == beneficiary,
            "Only the beneficiary can claim the prize."
        );
        require(block.timestamp >= unlockTime, "Prize is still locked.");
        payable(beneficiary).transfer(prizeAmount);
        prizeAmount = 0; // Reset the prize amount
    }
}
