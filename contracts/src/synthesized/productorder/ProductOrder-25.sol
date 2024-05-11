pragma solidity ^0.8.0;

contract ProductOrder {
    address public customer;
    address public admin;
    enum OrderStatus {
        Created,
        Paid,
        Confirmed,
        Shipped,
        Cancelled
    }
    OrderStatus public status;
    uint256 public price;

    constructor(uint256 _price, address _admin) {
        customer = msg.sender;
        status = OrderStatus.Created;
        price = _price;
        admin = _admin; // Admin set at contract creation
    }

    function payForOrder() public payable {
        require(
            status == OrderStatus.Created,
            "Order has already been processed."
        );
        require(msg.value == price, "Incorrect payment amount.");
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

    function cancelOrder() public {
        require(
            msg.sender == customer || msg.sender == admin,
            "Unauthorized access."
        );
        require(
            status == OrderStatus.Created || status == OrderStatus.Paid,
            "Order cannot be cancelled."
        );
        status = OrderStatus.Cancelled;
        // Refund the payment if the order was paid
        if (status == OrderStatus.Paid) {
            (bool sent, ) = customer.call{value: price}("");
            require(sent, "Failed to refund payment");
        }
    }

    // Allow the contract to receive and send ether
    receive() external payable {}
}
