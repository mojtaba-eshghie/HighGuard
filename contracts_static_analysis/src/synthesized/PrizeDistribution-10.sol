pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 3 minutes; // Short unlock period assuming reliable timing
        prizeAmount = msg.value;
    }

    function extendUnlockTime() public {
        require(
            msg.sender == organizer,
            "Only the organizer can extend the unlock time."
        );
        // Extend unlock time by an additional 2 minutes
        unlockTime += 2 minutes;
    }

    function claimPrize() public {
        require(
            msg.sender == beneficiary,
            "Only the beneficiary can claim the prize."
        );
        require(block.timestamp >= unlockTime, "Prize is still locked.");
        payable(beneficiary).transfer(prizeAmount);
        prizeAmount = 0; // Reset prize after claiming
    }

    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }
}
