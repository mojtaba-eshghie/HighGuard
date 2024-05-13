pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    bool public lockEnabled; // This variable controls whether the prize is locked or not

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 1 days;
        prizeAmount = msg.value;
        lockEnabled = true;
    }

    function toggleLock(bool _lockState) external {
        require(
            msg.sender == organizer,
            "Only the organizer can toggle the lock."
        );
        lockEnabled = _lockState;
    }

    function claimPrize() public {
        require(
            msg.sender == beneficiary,
            "Only the beneficiary can claim the prize."
        );
        require(
            !lockEnabled || block.timestamp >= unlockTime,
            "Prize is still locked."
        );
        payable(beneficiary).transfer(prizeAmount);
        prizeAmount = 0; // Reset prize after claiming
    }

    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }
}
