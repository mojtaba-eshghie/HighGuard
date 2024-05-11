pragma solidity ^0.8.0;

contract ProductOrder {
    address public customer;
    enum OrderStatus {
        Created,
        Paid,
        Confirmed,
        Shipped,
        Refunded,
        Cancelled
    }
    OrderStatus public status;
    uint256 public price;
    mapping(address => uint256) public balances; // Track overpayments for possible refunds

    constructor(uint256 _price) {
        customer = msg.sender;
        status = OrderStatus.Created;
        price = _price;
    }

    function payForOrder() public payable {
        require(
            status == OrderStatus.Created,
            "Order has already been processed."
        );
        require(msg.value >= price, "Payment amount is incorrect."); // Allows any payment equal to or above the price
        balances[msg.sender] += msg.value; // Tracks the payment, even if it's an overpayment
        status = OrderStatus.Paid;
    }

    function confirmOrder() public {
        require(
            status == OrderStatus.Paid,
            "Order must be paid for before confirmation."
        );
        status = OrderStatus.Confirmed;
    }

    function shipOrder() public {
        require(
            status == OrderStatus.Confirmed,
            "Order must be confirmed before shipping."
        );
        status = OrderStatus.Shipped;
    }

    function refundOverpayment() public {
        uint256 overpayment = balances[msg.sender] - price;
        require(overpayment > 0, "No overpayment to refund.");
        balances[msg.sender] -= overpayment;
        (bool sent, ) = msg.sender.call{value: overpayment}("");
        require(sent, "Failed to send Ether");
    }

    // Allow the contract to receive and send ether
    receive() external payable {}
}
