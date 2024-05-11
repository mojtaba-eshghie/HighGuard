pragma solidity ^0.8.0;

contract ProductOrder {
    address public customer;
    enum OrderStatus {
        Created,
        Paid,
        Confirmed,
        Shipped,
        Refunded
    }
    OrderStatus public status;
    uint256 public price;
    mapping(address => uint256) public payments; // Track payments to enable refunds

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
        require(msg.value == price, "Incorrect payment amount.");
        payments[msg.sender] = msg.value; // Record the payment
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

    // Refund order if not yet shipped
    function refundOrder() public {
        require(
            payments[msg.sender] > 0 &&
                (status == OrderStatus.Paid || status == OrderStatus.Confirmed),
            "No refund available."
        );
        uint256 amountToRefund = payments[msg.sender];
        payments[msg.sender] = 0; // Reset payment record
        (bool sent, ) = msg.sender.call{value: amountToRefund}("");
        require(sent, "Failed to send Ether");
        status = OrderStatus.Refunded;
    }

    // Allow the contract to receive and send ether
    receive() external payable {}
}
