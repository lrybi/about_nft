
    // (copy và chỉnh sửa từ: https://github.com/PatrickAlphaC/hardhat-nft-fcc/blob/main/test/unit/dynamicSvg.test.js)


// We are going to skimp a bit on these tests...

const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const fs = require("fs");


const lowSvgImageEncode = fs.readFileSync("./images/dynamicNft/frown.svg", { encoding: "base64" }).toString();
    // fs.readFileSync có thể đọc và đọc và encode truyển nội dung của một file thành chuỗi mã hóa base64
        // { encoding: "base64" }: This option specifies that the file should be read with base64 encoding. This ensures that the content of the file is converted into a base64 encoded string.
const lowSVGImageUri = `data:image/svg+xml;base64,${lowSvgImageEncode}`

const highSvgImageEncode = fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "base64" }).toString();
    // fs.readFileSync có thể đọc và đọc và encode truyển nội dung của một file thành chuỗi mã hóa base64
        // { encoding: "base64" }: This option specifies that the file should be read with base64 encoding. This ensures that the content of the file is converted into a base64 encoded string.
const highSVGimageUri = `data:image/svg+xml;base64,${highSvgImageEncode}`

// console.log(lowSVGImageUri)
// console.log(highSVGimageUri)


const correctLowJSON_URI = {
    name: "frown",
    description: "An NFT that changes based on the Chainlink Feed",
    attributes: [{"trait_type": "coolness", "value": 100}],
    image: lowSVGImageUri
}
let lowJsonStr = (JSON.stringify(correctLowJSON_URI)).toString();
    // JSON.stringify() là một hàm trong JavaScript được sử dụng để chuyển đổi đối tượng (object) JavaScript thành một chuỗi JSON.
    // lưu ý là JSON.stringify() sẽ không trả về khoảng trắng nào giữa các phần tử của object hay array trong nó
    // vậy nên ở bên file contract contracts\DynamicSvgNft.sol phải ko để bất kỳ khoảng trắng nào giữa các phần tử của object hay array. Điều này là để trong quá trình test này ta sẽ có sử dụng JSON.stringify() để test và hàm này thì sẽ trả về không khoảng trắng nào (giữa các phần tử của object hay array). Từ đó 2 mã hóa mới khớp nhau được
const lowTokenUri = `data:application/json;base64,${Buffer.from(lowJsonStr).toString("base64")}`;
    // Để mã hóa một chuỗi (string) thành mã base64 trong JavaScript, bạn có thể sử dụng hàm Buffer.from() của NodeJs kết hợp với phương thức toString() với đối số là 'base64'

const correctHighJSON_URI = {
    name: "happy",
    description: "An NFT that changes based on the Chainlink Feed",
    attributes: [{"trait_type": "coolness", "value": 100}],
    image: highSVGimageUri
}
let highJsonStr = (JSON.stringify(correctHighJSON_URI)).toString();
    // JSON.stringify() là một hàm trong JavaScript được sử dụng để chuyển đổi đối tượng (object) JavaScript thành một chuỗi JSON.
    // lưu ý là JSON.stringify() sẽ không trả về khoảng trắng nào giữa các phần tử của object hay array trong nó
    // vậy nên ở bên file contract contracts\DynamicSvgNft.sol phải ko để bất kỳ khoảng trắng nào giữa các phần tử của object hay array. Điều này là để trong quá trình test này ta sẽ có sử dụng JSON.stringify() để test và hàm này thì sẽ trả về không khoảng trắng nào (giữa các phần tử của object hay array). Từ đó 2 mã hóa mới khớp nhau được
const highTokenUri = `data:application/json;base64,${Buffer.from(highJsonStr).toString("base64")}`;
    // Để mã hóa một chuỗi (string) thành mã base64 trong JavaScript, bạn có thể sử dụng hàm Buffer.from() của NodeJs kết hợp với phương thức toString() với đối số là 'base64'

// console.log(lowSVGImageUri)
// console.log(highSVGimageUri)


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
                // console.log(lowSVG)
                const highSVG = await dynamicSvgNft.getHighSVG()
                // console.log(highSVG)
                const priceFeed = await dynamicSvgNft.getPriceFeed()
                assert.equal(lowSVG, lowSVGImageUri)
                assert.equal(highSVG, highSVGimageUri)
                assert.equal(priceFeed, mockV3Aggregator.address)
            })
        })

        describe("mintNft", () => {
            it("emits an event and creates the NFT", async function () {
                const highValue = ethers.parseEther("0.000000000000000001")
                    // (ở đây cố tình để vào giá trị rất nhỏ để giá priceFeed (ở đây sẽ phụ thuộc vào MockV3Aggregator) có thể lớn hơn nó)
                await expect(dynamicSvgNft.mintNft(highValue)).to.emit(
                    dynamicSvgNft,
                    "CreatedNFT"
                ).withArgs(0, highValue);
                const tokenCounter = await dynamicSvgNft.getTokenCounter()
                assert.equal(tokenCounter.toString(), "1")
                const tokenURI = await dynamicSvgNft.tokenURI(0)
                // console.log(tokenURI);
                assert.equal(tokenURI, highTokenUri)
                    // (vì đã cố tình để vào giá trị highValue rất nhỏ để giá priceFeed (ở đây sẽ phụ thuộc vào MockV3Aggregator) có thể lớn hơn nó -> highTokenUri)
            })
            it("shifts the token uri to lower when the price doesn't surpass the highvalue", async function () {
                const highValue = ethers.parseEther("100000000")
                    // (ở đây cố tình để vào giá trị rất lớn để giá priceFeed (ở đây sẽ phụ thuộc vào MockV3Aggregator) sẽ nhỏ hơn nó)
                const txResponse = await dynamicSvgNft.mintNft(highValue)
                await txResponse.wait(1)
                const tokenURI = await dynamicSvgNft.tokenURI(0)
                // console.log(tokenURI);
                assert.equal(tokenURI, lowTokenUri)
                    // (vì đã cố tình để vào giá trị highValue rất lớn để giá priceFeed (ở đây sẽ phụ thuộc vào MockV3Aggregator) sẽ nhỏ hơn nó -> lowTokenUri)
            })
        })

        // probably want more tests checking the svg -> token URI conversion svgToImageURI
        // More coverage of course
        // Maybe some tokenURI oddities
    })


// để chạy test: "yarn hh test test\unit\dynamicSvg.test.js"
    // (If you have multiple files you can do "yarn hardhat test <test\testfile.js>")