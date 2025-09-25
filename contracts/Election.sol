// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

contract Election {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
        string description;
        bool isActive;
    }

    struct Voter {
        bool hasVoted;
        uint votedFor;
        uint timestamp;
    }

    address public owner;
    string public electionName;
    string public electionDescription;
    uint public votingStartTime;
    uint public votingEndTime;
    bool public electionActive;
    
    mapping(address => Voter) public voters;
    mapping(uint => Candidate) public candidates;
    uint public candidatesCount;
    uint public totalVotes;

    // Events
    event Voted(address indexed voter, uint indexed candidateId, uint timestamp);
    event CandidateAdded(uint indexed candidateId, string name);
    event ElectionStarted(uint startTime);
    event ElectionEnded(uint endTime);
    event CandidateStatusChanged(uint indexed candidateId, bool isActive);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier electionIsActive() {
        require(electionActive, "Election is not active");
        require(block.timestamp >= votingStartTime, "Voting has not started yet");
        require(block.timestamp <= votingEndTime, "Voting has ended");
        _;
    }

    modifier validCandidate(uint _candidateId) {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate id");
        require(candidates[_candidateId].isActive, "Candidate is not active");
        _;
    }

    constructor() {
        owner = msg.sender;
        electionName = "General Election 2025";
        electionDescription = "Democratic voting for leadership positions";
        electionActive = true;
        
        // Set voting period (24 hours from deployment)
        votingStartTime = block.timestamp;
        votingEndTime = block.timestamp + 24 hours;

        // Initialize with default candidates
        addCandidate("Alice Johnson", "Experienced leader focused on economic growth");
        addCandidate("Bob Smith", "Environmental advocate with progressive policies");
        addCandidate("Carol Davis", "Community organizer promoting social justice");
    }

    function addCandidate(string memory _name, string memory _description) public onlyOwner {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        require(bytes(_description).length > 0, "Candidate description cannot be empty");
        
        candidatesCount++;
        candidates[candidatesCount] = Candidate(
            candidatesCount,
            _name,
            0,
            _description,
            true
        );
        
        emit CandidateAdded(candidatesCount, _name);
    }

    function toggleCandidateStatus(uint _candidateId) public onlyOwner validCandidate(_candidateId) {
        candidates[_candidateId].isActive = !candidates[_candidateId].isActive;
        emit CandidateStatusChanged(_candidateId, candidates[_candidateId].isActive);
    }

    function vote(uint _candidateId) public electionIsActive validCandidate(_candidateId) {
        require(!voters[msg.sender].hasVoted, "You have already voted");
        
        // Record the vote
        voters[msg.sender] = Voter({
            hasVoted: true,
            votedFor: _candidateId,
            timestamp: block.timestamp
        });

        // Update candidate vote count
        candidates[_candidateId].voteCount++;
        totalVotes++;

        emit Voted(msg.sender, _candidateId, block.timestamp);
    }

    function getCandidate(uint _candidateId) public view returns (
        uint id,
        string memory name,
        uint voteCount,
        string memory description,
        bool isActive
    ) {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate id");
        Candidate memory candidate = candidates[_candidateId];
        return (
            candidate.id,
            candidate.name,
            candidate.voteCount,
            candidate.description,
            candidate.isActive
        );
    }

    function getAllCandidates() public view returns (
        uint[] memory ids,
        string[] memory names,
        uint[] memory voteCounts,
        string[] memory descriptions,
        bool[] memory activeStatus
    ) {
        ids = new uint[](candidatesCount);
        names = new string[](candidatesCount);
        voteCounts = new uint[](candidatesCount);
        descriptions = new string[](candidatesCount);
        activeStatus = new bool[](candidatesCount);

        for (uint i = 1; i <= candidatesCount; i++) {
            ids[i-1] = candidates[i].id;
            names[i-1] = candidates[i].name;
            voteCounts[i-1] = candidates[i].voteCount;
            descriptions[i-1] = candidates[i].description;
            activeStatus[i-1] = candidates[i].isActive;
        }
    }

    function getElectionInfo() public view returns (
        string memory name,
        string memory description,
        uint startTime,
        uint endTime,
        bool active,
        uint totalVotesCast
    ) {
        return (
            electionName,
            electionDescription,
            votingStartTime,
            votingEndTime,
            electionActive,
            totalVotes
        );
    }

    function getRemainingTime() public view returns (uint) {
        if (block.timestamp >= votingEndTime) {
            return 0;
        }
        return votingEndTime - block.timestamp;
    }

    function getVoterInfo(address _voter) public view returns (
        bool hasVoted,
        uint votedFor,
        uint timestamp
    ) {
        Voter memory voter = voters[_voter];
        return (voter.hasVoted, voter.votedFor, voter.timestamp);
    }

    function endElection() public onlyOwner {
        electionActive = false;
        emit ElectionEnded(block.timestamp);
    }

    function extendElection(uint _additionalHours) public onlyOwner {
        require(electionActive, "Election is not active");
        votingEndTime += _additionalHours * 1 hours;
    }

    function getWinner() public view returns (uint winnerId, string memory winnerName, uint winnerVotes) {
        require(!electionActive || block.timestamp > votingEndTime, "Election is still active");
        
        uint maxVotes = 0;
        uint winningId = 0;
        
        for (uint i = 1; i <= candidatesCount; i++) {
            if (candidates[i].voteCount > maxVotes && candidates[i].isActive) {
                maxVotes = candidates[i].voteCount;
                winningId = i;
            }
        }
        
        if (winningId > 0) {
            return (winningId, candidates[winningId].name, maxVotes);
        }
        
        return (0, "No winner", 0);
    }

    // Emergency function to pause voting
    function pauseElection() public onlyOwner {
        electionActive = false;
    }

    function resumeElection() public onlyOwner {
        electionActive = true;
    }
}