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
    mapping(address => bool) public bidCancelled; // Tracks whether a bid has been cancelled
    address public highestBidder;
    uint256 public highestBid;

    constructor() {
        auctioneer = msg.sender; // The auctioneer initially controls the auction.
    }

    function commitBid(bytes32 hashedBid) public {
        require(currentPhase == AuctionPhase.Commit, "Not in Commit Phase.");
        commitments[msg.sender] = hashedBid;
    }

    function revealBid(uint256 amount, string memory secret) public {
        require(currentPhase == AuctionPhase.Reveal, "Not in Reveal Phase.");
        require(!bidCancelled[msg.sender], "Bid has been cancelled.");
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

    // Vulnerability: Allows cancellation of bids at any time without checks
    function cancelBid() public {
        bidCancelled[msg.sender] = true; // Simply marks the bid as cancelled
        commitments[msg.sender] = 0x0;
        revealedBids[msg.sender] = 0;
    }

    function endAuction() public {
        require(
            currentPhase == AuctionPhase.Reveal,
            "Auction not in reveal phase."
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
