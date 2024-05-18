const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const fs = require("fs");
const lowSvgImageEncode = fs.readFileSync("./images/dynamicNft/frown.svg", { encoding: "base64" }).toString();
const lowSVGImageUri = `data:image/svg+xml;base64,${lowSvgImageEncode}`

const highSvgImageEncode = fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "base64" }).toString();
const highSVGimageUri = `data:image/svg+xml;base64,${highSvgImageEncode}`
const correctLowJSON_URI = {
    name: "frown",
    description: "An NFT that changes based on the Chainlink Feed",
    attributes: [{"trait_type": "coolness", "value": 100}],
    image: lowSVGImageUri
}
let lowJsonStr = (JSON.stringify(correctLowJSON_URI)).toString();const lowTokenUri = `data:application/json;base64,${Buffer.from(lowJsonStr).toString("base64")}`;const correctHighJSON_URI = {
    name: "happy",
    description: "An NFT that changes based on the Chainlink Feed",
    attributes: [{"trait_type": "coolness", "value": 100}],
    image: highSVGimageUri
}
let highJsonStr = (JSON.stringify(correctHighJSON_URI)).toString();
const highTokenUri = `data:application/json;base64,${Buffer.from(highJsonStr).toString("base64")}`;

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Dynamic SVG NFT Unit Tests", function () {
        let dynamicSvgNft, signer, mockV3Aggregator

        beforeEach(async () => {
            const { deployer } = await getNamedAccounts();
            signer = await ethers.getSigner(deployer);
            const contracts = await deployments.fixture(["mocks", "dynamicsvg"])
            dynamicSvgNft = await ethers.getContractAt("DynamicSvgNft", contracts["DynamicSvgNft"].address, signer)
            mockV3Aggregator = await deployments.get("MockV3Aggregator")
        })

        describe("constructor", () => {
            it("sets starting values correctly", async function () {
                const lowSVG = await dynamicSvgNft.getLowSVG()
                
                const highSVG = await dynamicSvgNft.getHighSVG()
                
                const priceFeed = await dynamicSvgNft.getPriceFeed()
                assert.equal(lowSVG, lowSVGImageUri)
                assert.equal(highSVG, highSVGimageUri)
                assert.equal(priceFeed, mockV3Aggregator.address)
            })
        })

        describe("mintNft", () => {
            it("emits an event and creates the NFT", async function () {
                const highValue = ethers.parseEther("0.000000000000000001")
                    
                await expect(dynamicSvgNft.mintNft(highValue)).to.emit(
                    dynamicSvgNft,
                    "CreatedNFT"
                ).withArgs(0, highValue);
                const tokenCounter = await dynamicSvgNft.getTokenCounter()
                assert.equal(tokenCounter.toString(), "1")
                const tokenURI = await dynamicSvgNft.tokenURI(0)
                
                assert.equal(tokenURI, highTokenUri)
                    
            })
            it("shifts the token uri to lower when the price doesn't surpass the highvalue", async function () {
                const highValue = ethers.parseEther("100000000")
                    
                const txResponse = await dynamicSvgNft.mintNft(highValue)
                await txResponse.wait(1)
                const tokenURI = await dynamicSvgNft.tokenURI(0)
                
                assert.equal(tokenURI, lowTokenUri)
                    
            })
        })
    })    