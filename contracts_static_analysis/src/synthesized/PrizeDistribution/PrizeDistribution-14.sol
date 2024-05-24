pragma solidity ^0.7.6;

contract PrizeDistribution {
    address public organizer;
    address public beneficiary;
    uint256 public unlockTime;
    uint256 public prizeAmount;
    mapping(address => uint256) public lastActionTimestamp; // Tracks the last action time for each user

    constructor(address _beneficiary) payable {
        organizer = msg.sender;
        beneficiary = _beneficiary;
        unlockTime = block.timestamp + 1 days;
        prizeAmount = msg.value;
    }

    function recordAction(uint256 userTimestamp) public {
        require(
            userTimestamp > lastActionTimestamp[msg.sender],
            "Timestamp must be later than last recorded."
        );
        lastActionTimestamp[msg.sender] = userTimestamp; // Update the last action time with user-provided timestamp
    }

    function claimPrize(uint256 userTimestamp) public {
        require(
            msg.sender == beneficiary,
            "Only the beneficiary can claim the prize."
        );
        require(
            userTimestamp >= unlockTime,
            "User-provided timestamp indicates it's not time yet."
        );
        require(
            block.timestamp >= unlockTime,
            "Prize is still locked based on block timestamp."
        );
        payable(beneficiary).transfer(prizeAmount);
        prizeAmount = 0; // Reset prize after claiming
    }

    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }
}
