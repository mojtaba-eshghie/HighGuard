pragma solidity ^0.6.0;

interface IExternalValidator {
    function validateTransaction(address user) external returns (bool);
}

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

    IExternalValidator public validator; // External contract for additional validations

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
        uint _delayUntilRelease,
        address validatorAddress
    ) public {
        sender = _sender;
        receiver = _receiver;
        delayUntilRelease = _delayUntilRelease;
        validator = IExternalValidator(validatorAddress);

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

    function approveWithdrawal()
        public
        by(sender)
        stateIs(State.DepositPlaced)
    {
        releasedBySender = true;
    }

    function checkAndWithdraw()
        public
        by(receiver)
        stateIs(State.DepositPlaced)
    {
        require(now >= releaseTime, "Release time has not been reached yet");
        require(releasedBySender, "Sender has not released the escrow");

        // Unchecked call to an external contract
        if (validator.validateTransaction(receiver)) {
            releasedByReceiver = true;
        }

        require(releasedByReceiver, "External validation failed");

        uint tmp = amountInEscrow;
        amountInEscrow = 0;
        state = State.AwaitingDeposit;
        receiver.transfer(tmp);
    }
}
