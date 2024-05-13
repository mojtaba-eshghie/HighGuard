pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    bool public specialEventActive;

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 10 seconds;
        prizeAmount = msg.value;
        specialEventActive = false;
    }

    function activateSpecialEvent() public {
        require(
            msg.sender == organizer,
            "Only the organizer can activate the special event."
        );
        // An external condition, simulated here by a function call, activates the special event
        specialEventActive = true;
        unlockTime = block.timestamp; // Temporarily sets unlock time to current time
    }

    function deactivateSpecialEvent() public {
        require(
            msg.sender == organizer,
            "Only the organizer can deactivate the special event."
        );
        specialEventActive = false;
        unlockTime = block.timestamp + 1 days; // Reset the unlock time to be one day later
    }

    function claimPrize() public {
        require(
            msg.sender == beneficiary,
            "Only the beneficiary can claim the prize."
        );
        require(
            block.timestamp >= unlockTime || specialEventActive,
            "Prize is still locked or special conditions not met."
        );
        payable(beneficiary).transfer(prizeAmount);
        prizeAmount = 0; // Reset prize after claiming
    }

    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }
}
