pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    uint256 public balanceThreshold = 100 ether;

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 1 days;
        prizeAmount = msg.value;
    }

    function addFundsAndExtendLock(uint256 amount) public payable {
        require(
            msg.value == amount,
            "Amount sent does not match the parameter."
        );

        if (address(this).balance > balanceThreshold) {
            // Incorrectly reduce unlock time due to excess balance
            unlockTime -=
                (10 seconds * (address(this).balance - balanceThreshold)) /
                1 ether;
        } else {
            // Normally extend unlock time
            unlockTime += (10 seconds * amount) / 1 ether;
        }

        prizeAmount += msg.value; // Increase prize amount by the amount added
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
