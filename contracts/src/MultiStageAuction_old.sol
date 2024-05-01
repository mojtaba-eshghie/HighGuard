pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";

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

    // Vulnerability: Users can reveal bids during the Commit Phase
    function revealBid(uint256 amount, string memory secret) public {
        bytes32 hashedBid = keccak256(
            abi.encodePacked(Strings.toString(amount), secret)
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

    // Axiliary function, do not use in real-world scenarios; do it locally;
    function getHashFromInput(
        uint256 amount,
        string memory secret
    ) public view returns (bytes32) {
        bytes32 hashedBid = keccak256(
            abi.encodePacked(Strings.toString(amount), secret)
        );
        return hashedBid;
    }
}

// 1. First a function call to getHashFromInput with an arbitrary number and arbitrary secret (1, "mysecret");
//      We get the required hashedBid from the above call;
// 2. Then, making a transaction to commitBid function with the same hashedBid from the first call
// 3. Then, immedaiately after the above succeeds, make another transaction to revealBid function with the same parameters as (1);
// Here you go! If the third transaction goes through, a malicious interaction has happened.
