pragma solidity >=0.5.5;

/* Simple one shot, time locked and conditional on two-party release escrow smart contract */

contract Escrow2 {
    enum State {
        AwaitingDeposit,
        DepositPlaced,
        Withdrawn
    }

    // Monitor: creating the mapping to store the function names useful for the Happens event
    mapping(bytes4 => string) public functionNames;
    // Monitor: Happens will be emitted each time a state-changing function is executed.
    event Happens(string functionName);
    // Monitor: inform modifier will emit Happens event after each state-changing function execution.
    modifier inform(bytes4 selector) {
        _;
        emit Happens(functionNames[selector]);
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

        // Monitor: adding the function names to the selector to name mapping
        functionNames[this.placeInEscrow.selector] = "placeInEscrow";
        functionNames[this.releaseByReceiver.selector] = "releaseByReceiver";
        functionNames[this.releaseBySender.selector] = "releaseBySender";
        functionNames[this.withdrawFromEscrow.selector] = "withdrawFromEscrow";
    }

    function placeInEscrow()
        public
        payable
        by(sender)
        stateIs(State.AwaitingDeposit)
        inform(this.placeInEscrow.selector)
    {
        require(msg.value > 0);

        // Update parameters of escrow contract
        amountInEscrow = msg.value;
        releaseTime = now + delayUntilRelease;

        // Set contract state
        state = State.DepositPlaced;
    }

    function releaseBySender()
        public
        stateIs(State.DepositPlaced)
        inform(this.releaseBySender.selector)
    {
        if (msg.sender == sender) {
            releasedBySender = true;
        }
    }

    function releaseByReceiver()
        public
        stateIs(State.DepositPlaced)
        inform(this.releaseByReceiver.selector)
    {
        if (msg.sender == receiver) {
            releasedByReceiver = true;
        }
    }

    function withdrawFromEscrow()
        public
        by(receiver)
        stateIs(State.DepositPlaced)
        inform(this.withdrawFromEscrow.selector)
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
