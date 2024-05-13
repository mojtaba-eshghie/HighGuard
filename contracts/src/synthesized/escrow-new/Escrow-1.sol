pragma solidity ^0.6.0;

contract Escrow {
    enum State {
        AwaitingDeposit,
        DepositPlaced,
        ReadyToWithdraw
    }

    address public sender;
    address payable public receiver;

    uint public delayUntilRelease;
    uint public releaseTime;

    uint public amountInEscrow;
    bool public releasedBySender;

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

    function releaseBySender() public by(sender) stateIs(State.DepositPlaced) {
        releasedBySender = true;
        state = State.ReadyToWithdraw; // State transition upon sender's release
    }

    function releaseByReceiver()
        public
        by(receiver)
        stateIs(State.DepositPlaced)
    {
        if (now >= releaseTime) {
            state = State.ReadyToWithdraw; // Only transition if the time condition is met
        }
    }

    function withdrawFromEscrow()
        public
        by(receiver)
        stateIs(State.ReadyToWithdraw)
    {
        // The funds can only be withdrawn if the sender has released them
        require(releasedBySender, "Sender has not released the funds.");

        uint tmp = amountInEscrow;
        amountInEscrow = 0;
        state = State.AwaitingDeposit;
        receiver.transfer(tmp);
    }
}
