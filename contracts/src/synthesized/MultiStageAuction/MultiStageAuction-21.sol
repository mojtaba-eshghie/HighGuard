pragma solidity ^0.8.0;

contract MultiStageAuction {
    enum AuctionPhase {
        Commit,
        Reveal,
        Ended
    }

    AuctionPhase public currentPhase = AuctionPhase.Commit;
    address public auctioneer;

    mapping(address => bytes32) public commitments;
    mapping(address => uint256) public revealedBids;
    mapping(address => address) public bidOwners; // Maps bid ownership to addresses
    address public highestBidder;
    uint256 public highestBid;

    constructor() {
        auctioneer = msg.sender; // The auctioneer initiates and manages the auction.
    }

    function commitBid(bytes32 hashedBid, address bidder) public {
        require(currentPhase == AuctionPhase.Commit, "Not in Commit Phase.");
        commitments[bidder] = hashedBid; // Allows bids to be committed on behalf of any address
        bidOwners[bidder] = msg.sender; // Tracks who committed the bid
    }

    function revealBid(
        uint256 amount,
        string memory secret,
        address bidder
    ) public {
        require(currentPhase == AuctionPhase.Reveal, "Not in Reveal Phase.");
        bytes32 hashedBid = keccak256(
            abi.encodePacked(uint256ToString(amount), secret)
        );
        require(commitments[bidder] == hashedBid, "Invalid bid revealed.");
        require(bidOwners[bidder] == msg.sender, "You do not own this bid.");
        revealedBids[bidder] = amount;

        if (amount > highestBid) {
            highestBid = amount;
            highestBidder = bidder; // Registers the highest bid based on the bidder address provided
        }
    }

    function endAuction() public {
        require(
            auctioneer == msg.sender,
            "Only the auctioneer can end the auction."
        );
        currentPhase = AuctionPhase.Ended;
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
