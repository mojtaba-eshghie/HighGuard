// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.13 and less than 0.9.0
pragma solidity ^0.8.17;

contract Sample {
    bool public oneIsDone = false;

    event one_a();
    event two_a();

    modifier before() {
        require(oneIsDone);

        _;
    }

    function one() public {
        oneIsDone = true;
        emit one_a();
    }

    function two() public before {
        emit two_a();
    }
}
