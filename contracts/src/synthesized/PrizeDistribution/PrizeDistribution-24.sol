pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 constant MINIMUM_PAYMENT = 1 ether; // Minimum payment to trigger an extension

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 1 days;
        prizeAmount = msg.value;
    }

    function extendLockTime() public payable {
        require(
            msg.sender == organizer,
            "Only the organizer can extend the lock time."
        );

        if (msg.value < MINIMUM_PAYMENT) {
            unlockTime -= 10 minutes; // Incorrect logic: Reducing unlock time instead of not extending it
        } else {
            unlockTime += (msg.value / MINIMUM_PAYMENT) * 5 minutes; // Extend unlock time by 5 minutes for each ether
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
