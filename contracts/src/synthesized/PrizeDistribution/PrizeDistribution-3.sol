pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 public lastExtensionTime;
    uint256 public extensionCountToday;
    uint256 constant BONUS_THRESHOLD = 10 wei;
    uint256 constant DAY = 86400; // Seconds in a day

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 10 seconds;
        prizeAmount = msg.value;
        lastExtensionTime = 0;
        extensionCountToday = 0;
    }

    function extendLockTime() public payable {
        require(
            msg.sender == organizer,
            "Only the organizer can extend the lock time."
        );
        if (block.timestamp > lastExtensionTime + DAY) {
            extensionCountToday = 0; // Reset count if a day has passed
        }

        uint256 timeToAdd = (1 minutes * (msg.value / BONUS_THRESHOLD)) /
            (1 + extensionCountToday);
        unlockTime += timeToAdd;
        prizeAmount += msg.value;
        lastExtensionTime = block.timestamp;
        extensionCountToday++;
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
