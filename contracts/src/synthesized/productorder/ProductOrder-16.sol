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
        discountEndTime = block.timestamp + 1 minutes; // Set initial discount time
    }

    function applyDiscount() public {
        require(
            block.timestamp <= discountEndTime,
            "Discount period has ended."
        );
        if (price > 0) {
            price -= 1; // Potentially cause an underflow if this goes to 0 and is called again
        }
        discountEndTime = block.timestamp + 1 minutes; // Incorrectly reset the discount time
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
}
