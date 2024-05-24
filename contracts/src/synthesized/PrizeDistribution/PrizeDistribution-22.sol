pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary; // Receiver of the prize
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 public totalSent;
    uint256 constant BONUS_THRESHOLD = 10 wei; // If organizer sends 0.1 ether or more, they get a bonus period

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 10 seconds;
        prizeAmount = msg.value; // Initial prize amount set by the organizer
        totalSent = 0;
    }

    function extendLockTime() public payable {
        require(
            msg.sender == organizer,
            "Only the organizer can extend the lock time."
        );
        totalSent += msg.value;
        if (totalSent >= BONUS_THRESHOLD) {
            // Subtly increases unlockTime by a factor dependent on cumulative totalSent above the threshold
            unlockTime += (1 minutes * (totalSent / BONUS_THRESHOLD));
            totalSent = 0; // Reset totalSent after applying bonus
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
        prizeAmount = 0;
    }

    // Auxiliary functions
    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }
}
