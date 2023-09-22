pragma solidity ^0.8.0;

contract VulnerableVotingContract {
    mapping(address => bool) public hasVoted;
    mapping(string => uint256) public votes;
    uint256 public votingStartTime;
    uint256 public votingEndTime;
    bool public isInitialized = false;
    bool public isFinalized = false;

    string[] public candidates;
    string public winningCandidate;

    // Constructor to set the candidates
    constructor(string[] memory _candidates) {
        candidates = _candidates;
    }

    // This function is supposed to correctly initialize the votingStartTime
    function startVoting(uint256 _hoursFromNow) public {
        // Vulnerability: Setting votingStartTime without any condition
        votingStartTime = block.timestamp + (_hoursFromNow * 1 hours);
        votingEndTime = votingStartTime + (_hoursFromNow * 1 hours);
        isInitialized = true;
    }

    // This function checks if voting is allowed
    function canVote() private view returns (bool) {
        if (!isInitialized) {
            return false;
        }
        // Vulnerability: Not checking if votingStartTime is a valid value before allowing voting
        return
            block.timestamp >= votingStartTime &&
            block.timestamp <= votingEndTime;
    }

    // This function allows a user to vote for a candidate
    function vote(string memory candidate) public {
        require(canVote(), "Voting is not allowed yet");
        require(!hasVoted[msg.sender], "You have already voted");

        votes[candidate]++;
        hasVoted[msg.sender] = true;
    }

    // This function finalizes the voting and determines the winning candidate
    function finalizeVote() public {
        require(
            block.timestamp > votingEndTime,
            "Voting period has not ended yet"
        );
        require(!isFinalized, "Voting results have already been finalized");

        uint256 maxVotes = 0;
        for (uint i = 0; i < candidates.length; i++) {
            if (votes[candidates[i]] > maxVotes) {
                maxVotes = votes[candidates[i]];
                winningCandidate = candidates[i];
            }
        }

        isFinalized = true;
    }

    function getWinningCandidate() public view returns (string memory) {
        require(isFinalized, "Voting results have not been finalized yet");
        return winningCandidate;
    }
}
