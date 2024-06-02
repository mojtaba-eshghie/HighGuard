pragma solidity ^0.8.0;

contract ProductOrder {
    address public customer;
    enum OrderStatus {
        Created,
        Paid,
        Confirmed,
        Shipped,
        Cancelled
    }
    OrderStatus public status;
    uint256 public price;
    bool public resetEnabled = false; // Flag to control if resetting the order is allowed

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

    function toggleReset() public {
        // Toggle the ability to reset the order
        resetEnabled = !resetEnabled;
    }

    function resetOrder() public {
        require(resetEnabled, "Resetting the order is currently disabled.");
        status = OrderStatus.Created;
    }

    // Allow the contract to receive and send ether
    receive() external payable {}
}
