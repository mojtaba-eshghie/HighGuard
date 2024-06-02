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
    uint256 public discountEndTime;
    bool public discountApplied = false;

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
        price -= 1;
        discountApplied = true;
    }

    function payForOrder() public payable {
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

    // Introduced a logic flaw: allowing order to be shipped directly if paid, bypassing confirmation
    function shipOrder() public {
        require(
            status == OrderStatus.Paid || status == OrderStatus.Confirmed,
            "Order must be paid or confirmed before shipping."
        );
        status = OrderStatus.Shipped;
    }
}
