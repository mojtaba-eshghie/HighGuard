pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp; // Faulty initialization: Sets unlock time to current time instead of future
        prizeAmount = msg.value; // Initial prize amount set by the organizer
    }

    function extendLockTime(uint256 additionalTime) public {
        require(
            msg.sender == organizer,
            "Only the organizer can extend the lock time."
        );
        unlockTime += additionalTime; // Extend unlock time
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
