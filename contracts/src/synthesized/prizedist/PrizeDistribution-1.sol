pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 public numExtensions;
    uint256 constant BONUS_THRESHOLD = 10 wei;

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 10 seconds;
        prizeAmount = msg.value;
        numExtensions = 0;
    }

    function extendLockTime() public payable {
        require(
            msg.sender == organizer,
            "Only the organizer can extend the lock time."
        );
        uint256 bonusMultiplier = 1 minutes * (2 ** numExtensions);
        if (msg.value >= BONUS_THRESHOLD && numExtensions < 5) {
            unlockTime += bonusMultiplier;
            numExtensions++;
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
