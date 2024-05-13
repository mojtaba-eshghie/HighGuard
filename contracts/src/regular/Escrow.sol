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
        // Set parameters of escrow contract
        sender = _sender;
        receiver = _receiver;
        delayUntilRelease = _delayUntilRelease;

        releasedBySender = false;
        releasedByReceiver = false;

        // Set contract state
        state = State.AwaitingDeposit;
    }

    function placeInEscrow()
        public
        payable
        by(sender)
        stateIs(State.AwaitingDeposit)
    {
        require(msg.value > 0);

        // Update parameters of escrow contract
        amountInEscrow = msg.value;
        releaseTime = now + delayUntilRelease;

        // Set contract state
        state = State.DepositPlaced;
    }

    function releaseBySender() public stateIs(State.DepositPlaced) {
        if (msg.sender == sender) {
            releasedBySender = true;
        }
    }

    function releaseByReceiver() public stateIs(State.DepositPlaced) {
        if (msg.sender == receiver) {
            releasedByReceiver = true;
        }
    }

    function withdrawFromEscrow()
        public
        by(receiver)
        stateIs(State.DepositPlaced)
    {
        require(now >= releaseTime);
        //require(releasedByReceiver && releasedBySender);
        require(releasedByReceiver);

        uint tmp;
        tmp = amountInEscrow;

        // Set contract state
        state = State.AwaitingDeposit;

        // Set internal parameters of smart contract
        amountInEscrow = 0;

        // Send money
        receiver.transfer(tmp);
    }
}

// This Escrow contract has an obvious bug. It does not actually perform the the `require(releasedByReceiver && releasedBySender)` check;
// So, the receiver could basically steal the resources as immediately after the sender places in the escrow.
