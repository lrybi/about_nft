
    // (copy và chỉnh sửa từ: https://github.com/PatrickAlphaC/hardhat-nft-fcc/blob/main/test/unit/basicNft.test.js)

    
// We are going to skip a bit on these tests...

const { assert } = require("chai");
const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

//writing the test code from here..

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic NFT Unit Tests", function () {
        let basicNft, signer;

        beforeEach(async () => {
            const { deployer } = await getNamedAccounts();
            signer = await ethers.getSigner(deployer);
            const contracts = await deployments.fixture(["basicnft"]);
            basicNft = await ethers.getContractAt("BasicNft", contracts["BasicNft"].address, signer);
        })
        
        describe("Constructor", () => {
            it("Initializes the NFT Correctly.", async () => {
                const name = await basicNft.name();
                    // (hàm name() này là của bên contract cha ERC721)
                const symbol = await basicNft.symbol();
                    // (hàm symbol() này là của bên contract cha ERC721)
                const tokenCounter = await basicNft.getTokenCounter();
                assert.equal(name, "Dogie");
                assert.equal(symbol, "DOG");
                assert.equal(tokenCounter.toString(), "0");
            })
        })
//test02
        describe("Mint NFT", () => {
        beforeEach(async () => {
            const txResponse = await basicNft.mintNft();
            await txResponse.wait(1);
        })
        it("Allows users to mint an NFT, and updates appropriately", async function () {
            const tokenURI = await basicNft.tokenURI(0);
            const tokenCounter = await basicNft.getTokenCounter();

            assert.equal(tokenCounter.toString(), "1");
            assert.equal(tokenURI, await basicNft.TOKEN_URI()); // (TOKEN_URI là biến public của contract BasicNft)
        })
        it("Show the correct balance and owner of an NFT", async function () {
            const deployerAddress = signer.address;
            const deployerBalance = await basicNft.balanceOf(deployerAddress);
                // (hàm balanceOf() này là của bên contract cha ERC721)
            const owner = await basicNft.ownerOf("0");
                // (hàm ownerOf() này là của bên contract cha ERC721)
            assert.equal(deployerBalance.toString(), "1");
                // (ở bên contract cha ERC721 có hàm _update(...) và nó thực sự có cộng hay trừ "_balances[to] += 1;" ""_balances[to] -= 1;"" )
                    // (và nó cũng là một hàm virtual mà ta có thể override)
            assert.equal(owner, deployerAddress);
        })
    })
})


// để chạy test: "yarn hh test test\unit\basicNft.test.js"
    // (If you have multiple files you can do "yarn hardhat test <test\testfile.js>")