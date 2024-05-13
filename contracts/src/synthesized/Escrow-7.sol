pragma solidity ^0.6.0;

contract Escrow {
    enum State {
        AwaitingDeposit,
        DepositPlaced
    }

    address public sender;
    address payable public receiver;

    uint public delayUntilRelease;
    uint public staticReleaseTime;

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
        staticReleaseTime = now + delayUntilRelease; // Incorrectly updates static state
        state = State.DepositPlaced;
    }

    function withdrawFromEscrow()
        public
        by(receiver)
        stateIs(State.DepositPlaced)
    {
        require(
            now >= staticReleaseTime && releasedByReceiver && releasedBySender,
            "Not all conditions for withdrawal met"
        );

        uint tmp = amountInEscrow;
        amountInEscrow = 0;
        state = State.AwaitingDeposit;
        receiver.transfer(tmp);
    }
}
