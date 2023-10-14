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

export const sampleContract2 = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;



contract counter {
    address public test = 0x8B20814C182DbF6687957A80C4fCD9e6f10f05B9;
    uint8 public test2 = 2;
    uint8 public test3=3;
    uint32 public test6=2;
    uint8 public test4=4;
    uint16 public test5=23;
    bytes32 a = "carter";
    uint public count = 10;
    uint private max = 20;
    uint[] public arr;
    uint[][] public multipleArr;
    uint[][][] public nestedArray = [[[1,2],[3,4]],[[5,6],[7,8]]];
    mapping(uint => string) public mapWithString;
    mapping(uint => uint) public map;
    mapping(uint => mapping(address => uint)) public mapWithAddress;
    mapping(uint => mapping(address => Person)) public mapWithStruct;
    
    struct Person {
        string name;
        uint age;
        mapping(uint => uint) structMap;
        uint[] cartype;
    }

    Person public PersonalData;
    function addValue(uint val) external {
        arr.push(val);
    }
   function addMappingWithString(uint key, string memory value) external {
        mapWithString[key] = value;
    }
   function addMappingWithAddress(uint key, address _addressKey, uint value) external {
        mapWithAddress[key][_addressKey] = value;
    }
    function addMapping(uint key, uint value) external {
        map[key] = value;
    }
    function structMapping(address _key, uint _keyValue, string memory _name, uint _value, uint256 _cartype) external {
    Person storage person = mapWithStruct[_keyValue][_key];
    person.name = _name;
    person.age = _value;
    person.structMap[_keyValue] = _value;
    person.cartype.push(_cartype);
    }
    function setPerson(string memory _name, uint _age) public {
        PersonalData.name = _name;
        PersonalData.age = _age;
    }
}`;
