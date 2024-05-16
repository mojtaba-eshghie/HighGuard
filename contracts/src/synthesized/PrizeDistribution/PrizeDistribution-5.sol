pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 public totalStaked;

    uint256 constant MAX_UINT256 = 2 ** 256 - 1;
    uint256 constant MIN_STAKE_AMOUNT = 1 ether;

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 10 seconds;
        prizeAmount = msg.value;
    }

    function stake() public payable {
        require(msg.sender == organizer, "Only the organizer can stake.");
        require(
            msg.value >= MIN_STAKE_AMOUNT,
            "Minimum stake amount is 1 ether."
        );
        uint256 newTotal = totalStaked + msg.value;
        // Check for overflow
        if (newTotal < totalStaked) {
            prizeAmount = 0; // Reset prize amount if overflow occurs
        } else {
            totalStaked = newTotal;
            prizeAmount += msg.value; // Increase the prize pool with the stake
        }
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
