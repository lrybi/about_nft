// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
contract Encoding {    
    function combineStrings() public pure returns (string memory) {
        return string(abi.encodePacked("Hi Mom! ", "Miss you."));    }    function encodeNumber() public pure returns (bytes memory) {
        bytes memory number = abi.encode(1);
        return number;
    }    function encodeString() public pure returns (bytes memory) {
        bytes memory someString = abi.encode("some string");
        return someString;
    }    function encode1String() public pure returns (bytes memory) {
        bytes memory someString = abi.encode("some string");
        return someString;
    }

    function encode2StringPacked() public pure returns (bytes memory) {
        bytes memory someString = abi.encodePacked("some string");
        return someString;
    }

    function encode3Bytes() public pure returns (bytes memory) {
        bytes memory someString = bytes("some string");
        return someString;
    }

    function encode3_2Bytes() public pure returns (bytes memory) {
        bytes memory someString = bytes(bytes("some string"));
        return someString;
    }

    function encode4StringPacked() public pure returns (bytes memory) {
        bytes memory someString = abi.encode("some string 1", " some string 2");
        return someString;
    }

    function encode5StringPacked() public pure returns (bytes memory) {
        bytes memory someString = abi.encodePacked("some string 1", " some string 2");
        return someString;
    }    function multiDecode1() public pure returns (string memory, string memory) {
        (string memory someString, string memory someOtherString) = abi.decode(
            encode4StringPacked(),
            (string, string)
        );
        return (someString, someOtherString);
    }

    function multiDecode1_2() public pure returns (string memory) {
        string memory someString = abi.decode(
            encode4StringPacked(),
            (string)
        );
        return (someString);
    }

    function multiDecode2() public pure returns (string memory, string memory) {
        (string memory someString, string memory someOtherString) = abi.decode(
            encode5StringPacked(),
            (string, string)
        );
        return (someString, someOtherString);
    }       function multiDecode2_2() public pure returns (string memory) {
        string memory someString = string(
            encode5StringPacked()
        );
        return (someString);
    }      function withdraw(address recentWinner) public {
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        require(success, "Transfer Failed");
    }}