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
        prizeAmount = msg.value;
    }

    function extendLockTime(uint256 additionalTime) public payable {
        require(
            msg.sender == organizer,
            "Only the organizer can extend the lock time."
        );

        // Read the current unlock time
        uint256 currentUnlockTime = unlockTime;

        // Simulate processing delay which could be exploited in a race condition
        // This is purely illustrative; actual vulnerabilities would not intentionally include delays
        (bool delay, ) = address(this).call(
            abi.encodePacked(this.dummyDelay.selector)
        );

        // Update the unlock time based on the potentially stale currentUnlockTime
        unlockTime = currentUnlockTime + additionalTime;

        prizeAmount += msg.value; // Increase the prize amount
    }

    function dummyDelay() public {
        // Simulate a delay
        uint256 start = block.timestamp;
        while (block.timestamp < start + 1 seconds) {
            // Waste some time
        }
    }

    function claimPrize() public {
        require(
            msg.sender == beneficiary,
            "Only the beneficiary can claim the prize."
        );
        require(block.timestamp >= unlockTime, "Prize is still locked.");
        payable(beneficiary).transfer(prizeAmount);
        prizeAmount = 0; // Reset the prize amount after claiming
    }
}
