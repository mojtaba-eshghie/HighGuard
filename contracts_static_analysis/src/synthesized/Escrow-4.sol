pragma solidity ^0.6.0;

contract Escrow {
    enum State {
        AwaitingDeposit,
        DepositPlaced
    }

    address public sender;
    address payable public receiver;

    uint public delayUntilRelease;
    uint public releaseTime;

    uint public amountInEscrow;
    bool public releasedBySender;
    bool public releasedByReceiver;

    State public state;

    modifier by(address _address) {
        require(msg.sender == _address);
        _;
    }

    modifier stateIs(State _state) {
        require(state == _state);
        _;
    }

    constructor(
        address _sender,
        address payable _receiver,
        uint _delayUntilRelease
    ) public {
        sender = _sender;
        receiver = _receiver;
        delayUntilRelease = _delayUntilRelease;

        releasedBySender = false;
        releasedByReceiver = false;

        state = State.AwaitingDeposit;
    }

    function placeInEscrow()
        public
        payable
        by(sender)
        stateIs(State.AwaitingDeposit)
    {
        require(msg.value > 0);
        amountInEscrow = msg.value;
        releaseTime = now + delayUntilRelease;
        state = State.DepositPlaced;
    }

    function resetReleaseTime() public by(sender) stateIs(State.DepositPlaced) {
        // Vulnerability: Allows the sender to reset the release time repeatedly
        releaseTime = now + delayUntilRelease;
    }

    function withdrawFromEscrow()
        public
        by(receiver)
        stateIs(State.DepositPlaced)
    {
        require(now >= releaseTime, "Release time has not been reached yet");
        require(
            releasedByReceiver && releasedBySender,
            "Both parties must release the escrow"
        );

        uint tmp = amountInEscrow;
        amountInEscrow = 0;
        state = State.AwaitingDeposit;
        receiver.transfer(tmp);
    }
}
