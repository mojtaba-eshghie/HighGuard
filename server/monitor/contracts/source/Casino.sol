pragma solidity ^0.4.11;

contract Casino {
    //
    // A coin-tossing casino contract working as follows:
    //  * An operator may create a contract with an empty pot and timeout of 30min
    //  * The operator may add money to the pot at any time
    //  * As long as no player has placed a bet, the operator may (i) withdraw money
    //    from the pot and change the timeout value; (ii) submit a hashed secret number
    //    (even if she chooses HEADS, odd if she chooses TAILS)
    //  * A (non-operator) player may then place a bet (up to the size of the pot) with
    //    a guess of HEADS or TAILS
    //  * The operator may then submit her original number to resolve the bet
    //  * If the operator has not submitted her number by the timeout (from when the
    //    player placed the bet), the player may ask for a default win
    //  * If the player has won, he gets to withdraw his wager + the same value from the pot
    //  * If the casino has won, the wager goes to the pot
    //
    // EXPECTED BEHAVIOUR: The operator may not reduce the pot while a bet is active.
    //

    // Identity of who is running the casino
    address public operator;

    // The player is allowed to register a win if the operator does not
    // resolve a wager within this timeout
    uint256 public timeout;
    uint256 constant DEFAULT_TIMEOUT = 30 minutes;

    // The current pot of money which the operator is making available
    uint256 public pot;

    // The hashed number submitted by the operator
    bytes32 public hashedNumber;

    // Identity of the player (if any)
    address public player;

    // The current wager (if any)
    enum Coin {
        HEADS,
        TAILS
    }

    struct Wager {
        uint256 bet;
        Coin guess;
        uint256 timestamp;
    }

    Wager private wager;

    // The state of the contract
    enum State {
        IDLE,
        GAME_AVAILABLE,
        BET_PLACED
    }
    State private state;

    // -----------------------------------------
    // Modifiers
    //

    // Modifier to check state
    modifier inState(State _state) {
        require(_state == state);
        _;
    }

    // Modifier to check that the message was initiated by the operator
    modifier byOperator() {
        require(msg.sender == operator);
        _;
    }

    // Modifier to check that no bet is currently in place
    modifier noActiveBet() {
        require(state == State.IDLE || state == State.GAME_AVAILABLE);
        _;
    }

    // -----------------------------------------

    // Create a new casino
    constructor() public {
        operator = msg.sender;
        state = State.IDLE;
        timeout = DEFAULT_TIMEOUT;
        pot = 0;
        wager.bet = 0;
    }

    // Changing the timeout value
    function updateTimeout(uint256 _timeout) public byOperator noActiveBet {
        timeout = _timeout;
    }

    // Add money to pot
    function addToPot() public payable byOperator {
        // The operator can choose a positive value to pay and raise the pot by
        require(msg.value > 0);

        pot = pot + msg.value;
    }

    // Remove money from pot
    function removeFromPot(uint256 amount) public byOperator noActiveBet {
        // The operator may reduce the pot (by withdrawing the requested amount)
        // as long as there is no bet which is active
        require(amount > 0 && amount <= pot);

        pot = pot - amount;
        msg.sender.transfer(amount);
    }

    // Operator opens a bet
    function createGame(bytes32 _hashedNumber)
        public
        byOperator
        inState(State.IDLE)
    {
        hashedNumber = _hashedNumber;
        state = State.GAME_AVAILABLE;
    }

    //caller syntax: contractaddress.placeBet(HEADS).value(1000 Wei)

    // Player places a bet
    function placeBet(Coin _guess)
        public
        payable
        inState(State.GAME_AVAILABLE)
    {
        // Anyone other than the operator may place a bet as long as no other bets
        // are currently active and as long as enough money remains in the pot
        require(msg.sender != operator);
        require(msg.value > 0 && msg.value <= pot);

        state = State.BET_PLACED;
        player = msg.sender;

        wager = Wager({bet: msg.value, guess: _guess, timestamp: now});
    }

    // Operator resolves a bet
    function decideBet(uint256 secretNumber)
        public
        byOperator
        inState(State.BET_PLACED)
    {
        require(hashedNumber == keccak256(secretNumber));

        Coin secret = (secretNumber % 2 == 0) ? Coin.HEADS : Coin.TAILS;

        if (secret == wager.guess) {
            playerWins();
        } else {
            operatorWins();
        }

        state = State.IDLE;
    }

    // Player resolves a bet because of operator not acting on time
    function timeoutBet() public inState(State.BET_PLACED) {
        require(msg.sender == player);
        require(now - wager.timestamp > timeout);

        playerWins();
        state = State.IDLE;
    }

    // Player wins and gets back twice his original wager
    function playerWins() private {
        pot = pot - wager.bet;
        player.transfer(wager.bet * 2);
        wager.bet = 0;
    }

    // Operator wins, transferring the wager to the pot
    function operatorWins() private {
        pot = pot + wager.bet;
        wager.bet = 0;
    }

    // Operator closes casino
    function closeCasino() public inState(State.IDLE) byOperator {
        selfdestruct(operator);
    }

    function() {}
}
