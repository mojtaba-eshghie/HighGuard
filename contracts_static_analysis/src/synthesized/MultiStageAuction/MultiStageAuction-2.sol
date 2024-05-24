pragma solidity ^0.8.0;

contract MultiStageAuction {
    enum AuctionPhase {
        Commit,
        Reveal,
        Ended
    }

    AuctionPhase public currentPhase = AuctionPhase.Commit;

    mapping(address => bytes32) public commitments;
    mapping(address => uint256) public revealedBids;
    address public highestBidder;
    uint256 public highestBid;

    // Introducing a flag to check if commit phase was supposedly ended
    bool public isCommitPhaseSupposedToEnd = false;

    function commitBid(bytes32 hashedBid) public {
        // New vulnerability: allows committing if phase is not ended even if it's supposed to end
        require(
            currentPhase == AuctionPhase.Commit || !isCommitPhaseSupposedToEnd,
            "Commit phase ended or not in commit phase."
        );
        commitments[msg.sender] = hashedBid;
    }

    function revealBid(uint256 amount, string memory secret) public {
        require(currentPhase == AuctionPhase.Reveal, "Not in Reveal Phase.");
        bytes32 hashedBid = keccak256(
            abi.encodePacked(uint256ToString(amount), secret)
        );
        require(commitments[msg.sender] == hashedBid, "Invalid bid revealed.");
        revealedBids[msg.sender] = amount;

        if (amount > highestBid) {
            highestBid = amount;
            highestBidder = msg.sender;
        }
        currentPhase = AuctionPhase.Ended;
    }

    function endCommitPhase() public {
        require(
            currentPhase == AuctionPhase.Commit,
            "Commit phase already ended."
        );
        currentPhase = AuctionPhase.Reveal;
        isCommitPhaseSupposedToEnd = true; // This flag is set but can be bypassed due to the vulnerability
    }

    function getHashFromInput(
        uint256 amount,
        string memory secret
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(uint256ToString(amount), secret));
    }

    function uint256ToString(
        uint256 value
    ) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
