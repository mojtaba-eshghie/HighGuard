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
        discountEndTime = block.timestamp + 5 minutes; // Set initial discount time
    }

    function applyDiscount() external {
        require(
            block.timestamp <= discountEndTime || block.number % 100 == 0,
            "Discount period has ended or special condition not met."
        );
        price -= 1; // Reduce price by 1
        discountApplied = true;

        // If called at a specific block number, reset the discount period
        if (block.number % 100 == 0) {
            discountEndTime = block.timestamp + 5 minutes; // Extend the discount period
            discountApplied = false; // Reset the discount application flag
        }
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
