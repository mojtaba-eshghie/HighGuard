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
    bool public extraCondition = true; // An unrelated state property used to re-trigger discount
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
            block.timestamp <= discountEndTime && extraCondition,
            "Cannot apply discount."
        );
        price -= 1;
        discountApplied = true;
        extraCondition = false; // Reset condition
    }

    function resetExtraCondition() public {
        // Reset the extra condition based on some unrelated conditions
        require(
            status == OrderStatus.Created,
            "Can only reset if order is not progressed."
        );
        extraCondition = true;
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

    function shipOrder() public {
        require(
            status == OrderStatus.Confirmed,
            "Order must be confirmed before shipping."
        );
        status = OrderStatus.Shipped;
    }
}
