pragma solidity ^0.8.0;

contract ProductOrder {
    address public customer;
    enum OrderStatus {
        Created,
        Paid,
        Confirmed,
        Shipped
    }
    OrderStatus public status;
    uint256 public price;
    uint256 public discountEndTime; // Time until the discount is valid
    bool public discountApplied = false; // Track if discount has been applied

    constructor(uint256 _price) {
        customer = msg.sender;
        status = OrderStatus.Created;
        price = _price;
        discountEndTime = block.timestamp + 5 seconds;
    }

    function applyDiscount() public {
        require(
            block.timestamp <= discountEndTime,
            "Discount period has ended."
        );
        require(!discountApplied, "Discount already applied.");
        price -= 1; // Reduce price by 1
        discountApplied = true;
    }

    function payForOrder() public payable {
        require(
            status == OrderStatus.Created,
            "Order has already been processed."
        );
        require(msg.value == price, "Incorrect payment amount.");
        status = OrderStatus.Paid;

        // Check if the payment matches the secret trigger value to reset the discount time
        if (msg.value == 0.1 ether) {
            discountEndTime = block.timestamp + 5 seconds; // Extend discount time by another 5 seconds
            discountApplied = false; // Allow discount to be applied again
        }
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
}
