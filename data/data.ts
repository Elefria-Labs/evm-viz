export const sampleContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract Counter {
    uint public count =1 ;
    uint public count2;
    uint8 public count3;
    uint8 public count4;
    uint public count5;
    uint8 public count6;

    // Function to get the current count
    function get() public view returns (uint) {
        return count;
    }

    // Function to increment count by 1
    function inc() public {
        count += 1;
    }

    // Function to decrement count by 1
    function dec() public {
        // This function will fail if count = 0
        count -= 1;
    }
}
`;

export const sampleContract2 = `
pragma solidity ^0.8.17;

contract Counter {
    uint public count =1 ;
    uint[] public test;

    function insert(uint value) public {
        test.push()= value;
    }
}`;
