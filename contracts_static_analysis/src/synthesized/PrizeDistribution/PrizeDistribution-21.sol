pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 constant BONUS_THRESHOLD = 10 wei; // Simplified for example

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 1 days;
        prizeAmount = msg.value;
    }

    // Function to extend the unlock time based on additional funds sent
    function extendLockTime() public payable {
        require(
            msg.sender == organizer,
            "Only the organizer can extend the lock time."
        );
        uint256 additionalTime = (msg.value / BONUS_THRESHOLD) * 1 minutes;

        // Faulty logic where specific amounts (e.g., exactly at a multiple of BONUS_THRESHOLD) result in no time extension
        if ((msg.value % BONUS_THRESHOLD) == 0) {
            // No unlock time extension due to faulty boundary condition handling
            unlockTime += 0;
        } else {
            unlockTime += additionalTime;
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
        prizeAmount = 0; // Reset the prize amount
    }
}
