pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 1 days;
        prizeAmount = msg.value; // Initial prize amount set by the organizer
    }

    // Faulty function that lacks proper access control
    function extendLockTime(uint256 additionalTime) public {
        // No check to ensure only the organizer can call this function
        unlockTime += additionalTime;
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
