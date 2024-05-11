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
    mapping(address => bool) public hasWithdrawn;
    address public highestBidder;
    uint256 public highestBid;

    constructor() {
        auctioneer = msg.sender; // Set the auctioneer as the contract creator
    }

    function commitBid(bytes32 hashedBid) public {
        require(currentPhase == AuctionPhase.Commit, "Not in Commit Phase.");
        commitments[msg.sender] = hashedBid;
        hasWithdrawn[msg.sender] = false; // Reset withdrawal status on new commit
    }

    function revealBid(uint256 amount, string memory secret) public {
        require(currentPhase == AuctionPhase.Reveal, "Not in Reveal Phase.");
        require(!hasWithdrawn[msg.sender], "Bid already withdrawn.");
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

    // Vulnerability: Allows bid withdrawal even after reveal phase has started
    function withdrawBid() public {
        require(
            currentPhase != AuctionPhase.Ended,
            "Cannot withdraw after auction has ended."
        );
        require(!hasWithdrawn[msg.sender], "Already withdrawn.");
        hasWithdrawn[msg.sender] = true;
        commitments[msg.sender] = 0x0; // Erase the commitment
        revealedBids[msg.sender] = 0; // Erase the revealed bid
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
