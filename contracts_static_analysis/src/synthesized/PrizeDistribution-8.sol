pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 constant MINIMUM_EXTENSION_COST = 1 ether;

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 10 seconds;
        prizeAmount = msg.value;
    }

    function extendLockTime() public payable {
        uint256 extensionCost = calculateExtensionCost();
        require(
            msg.value >= extensionCost,
            "Insufficient payment for time extension."
        );
        unlockTime += 1 hours;

        // Simulate incorrect balance update leading to underflow
        if (address(this).balance < extensionCost) {
            // Underflow occurs if the balance is somehow lower than expected
            extensionCost = 0;
        }

        prizeAmount += msg.value; // Increase prize amount by the payment received
    }

    function calculateExtensionCost() public view returns (uint256) {
        uint256 baseCost = address(this).balance / 10; // Dynamic pricing based on current balance
        return
            baseCost > MINIMUM_EXTENSION_COST
                ? baseCost
                : MINIMUM_EXTENSION_COST;
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
