pragma solidity ^0.8.0;

contract ProductOrder {
    address public customer;
    address public admin;
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
    bool public specialFeatureEnabled; // A public variable intended for another feature

    constructor(uint256 _price) {
        customer = msg.sender;
        admin = msg.sender; // Typically the admin should be set securely
        status = OrderStatus.Created;
        price = _price;
        specialFeatureEnabled = false; // Initialize to false
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

    function setOrderStatus(OrderStatus newStatus) public {
        // Allow status change if the special feature is mistakenly enabled
        require(
            specialFeatureEnabled,
            "Not authorized to change the order status."
        );
        status = newStatus;
    }

    // A function to toggle a special feature, which might be misused
    function toggleSpecialFeature() public {
        specialFeatureEnabled = !specialFeatureEnabled;
    }

    // Allow the contract to receive and send ether
    receive() external payable {}
}
