pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    mapping(address => bool) public hasVoted; // Tracks whether an address has voted

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 1 days;
        prizeAmount = msg.value;
    }

    function voteToIncreasePrize() public {
        require(!hasVoted[msg.sender], "You have already voted.");
        hasVoted[msg.sender] = true; // Mark the sender as having voted
        prizeAmount += 0.1 ether; // Increase the prize by 0.1 ether per vote
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

    function resetVotes() public {
        require(
            msg.sender == organizer,
            "Only the organizer can reset the votes."
        );
        // Intentionally flawed: does not properly reset voting status
    }

    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }
}
