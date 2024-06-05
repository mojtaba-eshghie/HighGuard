pragma solidity ^0.8.0;

contract MultiStageAuction {
    enum AuctionPhase {
        Commit,
        Reveal,
        Ended
    }

    AuctionPhase public currentPhase = AuctionPhase.Commit;

    mapping(address => bytes32) public commitments; // Hashed bids
    mapping(address => uint256) public revealedBids;
    address public highestBidder;
    uint256 public highestBid;

    function commitBid(bytes32 hashedBid) public {
        require(currentPhase == AuctionPhase.Commit, "Not in Commit Phase.");
        commitments[msg.sender] = hashedBid;

        _endCommitPhase();
    }

    function revealBid(uint256 amount, string memory secret) public {
        bytes32 hashedBid = keccak256(
            abi.encodePacked(uint256ToString(amount), secret)
        );
        require(commitments[msg.sender] == hashedBid, "Invalid bid revealed.");

        revealedBids[msg.sender] = amount;

        if (amount > highestBid) {
            highestBid = amount;
            highestBidder = msg.sender;
        }
        currentPhase = AuctionPhase.Reveal;
        _endAuction();
    }

    function _endCommitPhase() internal {
        require(currentPhase == AuctionPhase.Commit, "Not in Commit Phase.");
        currentPhase = AuctionPhase.Reveal;
    }

    function _endAuction() internal {
        require(currentPhase == AuctionPhase.Reveal, "Not in Reveal Phase.");
        currentPhase = AuctionPhase.Ended;
    }

    function getCommittedHash() public view returns (bytes32) {
        return commitments[msg.sender];
    }

    function getHashFromInput(
        uint256 amount,
        string memory secret
    ) public pure returns (bytes32) {
        bytes32 hashedBid = keccak256(
            abi.encodePacked(uint256ToString(amount), secret)
        );
        return hashedBid;
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

// 1. First a function call to getHashFromInput with an arbitrary number and arbitrary secret (1, "mysecret");
//      We get the required hashedBid from the above call;
// 2. Then, making a transaction to commitBid function with the same hashedBid from the first call
// 3. Then, immedaiately after the above succeeds, make another transaction to revealBid function with the same parameters as (1);
// Here you go! If the third transaction goes through, a malicious interaction has happened.
