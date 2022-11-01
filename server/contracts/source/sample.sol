// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.13 and less than 0.9.0
pragma solidity ^0.8.17;

contract HelloWorld {
    bool public oneIsDone = false;

    event OneInvoked();
    event TwoInvoked();

    modifier before() {
        require(oneIsDone);

        _;
    }

    function one() public {
        oneIsDone = true;
        emit OneInvoked();
    }

    function two() public before {
        emit TwoInvoked();
    }
}
