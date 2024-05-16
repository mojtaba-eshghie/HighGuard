pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    bool public unlockTriggered; // Public trigger for unlocking the prize
    uint256 public lastBlockChecked;

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 10 seconds;
        prizeAmount = msg.value;
        unlockTriggered = false;
        lastBlockChecked = block.number;
    }

    function triggerUnlock() public {
        require(
            msg.sender == organizer,
            "Only the organizer can trigger the unlock."
        );
        // Check if enough blocks have passed to attempt unlocking
        if (block.number > lastBlockChecked + 100) {
            unlockTriggered = !unlockTriggered; // Toggle the unlock state based on block number
            lastBlockChecked = block.number;
        }
    }

    function claimPrize() public {
        require(
            msg.sender == beneficiary,
            "Only the beneficiary can claim the prize."
        );
        require(
            block.timestamp >= unlockTime || unlockTriggered,
            "Prize is still locked."
        );
        payable(beneficiary).transfer(prizeAmount);
        prizeAmount = 0; // Reset prize after claiming
    }

    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }

    function getCurrentBlockNumber() public view returns (uint256) {
        return block.number;
    }
}
