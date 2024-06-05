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
    mapping(address => uint256) public committedAmounts; // Tracks the committed amounts for update checks
    address public highestBidder;
    uint256 public highestBid;

    constructor() {
        auctioneer = msg.sender; // The auctioneer manages the auction.
    }

    function commitBid(bytes32 hashedBid, uint256 amount) public {
        require(currentPhase == AuctionPhase.Commit, "Not in Commit Phase.");
        commitments[msg.sender] = hashedBid;
        committedAmounts[msg.sender] = amount; // Record the initially committed amount
    }

    function updateBid(bytes32 newHashedBid, uint256 newAmount) public {
        require(
            currentPhase == AuctionPhase.Commit,
            "Cannot update bid outside Commit Phase."
        );
        require(committedAmounts[msg.sender] > 0, "No existing bid to update.");
        commitments[msg.sender] = newHashedBid;
        committedAmounts[msg.sender] = newAmount; // Stealthily update the committed amount
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
