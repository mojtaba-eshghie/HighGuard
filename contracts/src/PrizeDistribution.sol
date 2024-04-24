pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary; // Receiver of the prize
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 constant BONUS_THRESHOLD = 10 wei; // If organizer sends 0.1 ether or more, they get a bonus period

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 10 * 1 seconds;
        prizeAmount = msg.value; // Initial prize amount set by the organizer
    }

    function extendLockTime() public payable {
        require(
            msg.sender == organizer,
            "Only the organizer can extend the lock time."
        );
        if (msg.value >= BONUS_THRESHOLD) {
            // Subtly increases unlockTime by a factor dependent on how much above the threshold the payment is
            unlockTime += (1 minutes * (msg.value / BONUS_THRESHOLD));
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

    // Axiliary functions
    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }
}
