pragma solidity ^0.4.24;

contract commitReveal {
    string public option1;
    string public option2;

    uint public N;
    uint public s;
    uint public winner = 0;
    uint public votes1;
    uint public votes2;
    uint public endingTime;
    uint public numVotesCast = 0;
    uint public numReveals = 0;
    uint public revealersReward = 0;

    bytes32[] public commits;
    mapping(bytes32 => string) status; //checks whether status is commit or revealed
    mapping(address => bool) revealers;
    mapping(address => bool) rewardees;
    bool public rewardTaken = false;
    bool public isOpen;
    event newCommit(string s, bytes32 commit);
    event wins(string s1, string s2);

    constructor (uint n, uint stake, uint allowedPhaseSeconds, 
    string _option1, string _option2) {
        require(stake > 0);
        require(n > 1);
        endingTime = now + allowedPhaseSeconds;
        N = n;
        s = stake;
        option1 = _option1;
        option2 = _option2;
        isOpen = true;
    }

    function commitVote(bytes32 _commit) public payable {
        if (now > endingTime){
            revealLimitExceeded();
        } else {
            require(isOpen);
            require(msg.value == s);
            bytes memory checkNotDuplicate = bytes(status[_commit]);
            require(checkNotDuplicate.length == 0);
            commits.push(_commit);
            status[_commit] = "Committed";
            numVotesCast++;
            if (numVotesCast == N){
                isOpen = false;
            }
            emit newCommit('Vote committed', _commit);
        }
    }

    function revealVote(string _vote, bytes32 _commit) public{
        if (now > endingTime) {
            revealLimitExceeded();
        } else {
            require(numReveals <= N);

            bytes memory stat = bytes(status[_commit]);
            require(stat.length != 0);
            require(stat[0] == "C");
            require(_commit == keccak256(_vote));
            bytes memory bytesVote = bytes(_vote);
            require(bytesVote[0] == "1" || bytesVote[0] == "2");
            msg.sender.transfer(s);
            if (bytesVote[0] == "1" ){
                votes1++;
            } else {
                votes2++;
            }
            numReveals++;
            status[_commit] = "Revealed";
            revealers[msg.sender] = true;
            if (numReveals == N){
                revealWinner();
            }
        }
    }

    function revealWinner() internal {
        require(winner == 0);
        if (votes1 > votes2){
            winner  = 1;
            emit wins("Winner is ", option1);
            isOpen = false;
        } else if (votes2 > votes1) {
            winner  = 2;
            emit wins("Winner is ", option2);
            isOpen = false;
        } else {
            emit wins("Winner is ", "draw");
            isOpen = false;
        }
    }

    function revealLimitExceeded() internal {
        revealersReward = this.balance / numReveals;
        isOpen = false;
        revealWinner();
    }

    function claimReward() public {
        require(revealers[msg.sender]);
        require(!rewardees[msg.sender]);
        require(now > endingTime);
        if (!rewardTaken){
            revealLimitExceeded();
            msg.sender.transfer(revealersReward);
            rewardees[msg.sender] = true;
            rewardTaken = true;
        } else {
            msg.sender.transfer(revealersReward);
            rewardees[msg.sender] = true;
            rewardTaken = true;
        }
    }



}