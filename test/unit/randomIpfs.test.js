
    // (copy và chỉnh sửa từ: https://github.com/PatrickAlphaC/hardhat-nft-fcc/blob/main/test/unit/randomIpfs.test.js)


// We are going to skip a bit on these tests...

const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT Unit Tests", function () {
        let randomIpfsNft, signer, vrfCoordinatorV2Mock

        beforeEach(async () => {
            const { deployer } = await getNamedAccounts();
            signer = await ethers.getSigner(deployer);
            const contracts = await deployments.fixture(["mocks", "randomipfsnft"])
            randomIpfsNft = await ethers.getContractAt("RandomIpfsNft", contracts["RandomIpfsNft"].address, signer)
            vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", contracts["VRFCoordinatorV2Mock"].address, signer)
        })

        describe("constructor", () => {
            it("sets starting values correctly", async function () {
                const dogTokenUriZero = await randomIpfsNft.getDogTokenUris(0)
                const isInitialized = await randomIpfsNft.getInitialized()
                assert(dogTokenUriZero.includes("ipfs://"))
                assert.equal(isInitialized, true)
            })
        })

        describe("requestNft", () => {
            it("fails if payment isn't sent with the request", async function () {
                await expect(randomIpfsNft.requestNft()).to.be.revertedWithCustomError(
                    randomIpfsNft,
                    "RandomIpfsNft__NeedMoreETHSent"
                )
            })
            it("reverts if payment amount is less than the mint fee", async function () {
                const fee = await randomIpfsNft.getMintFee()
                await expect(
                    randomIpfsNft.requestNft({
                        value: (fee - ethers.parseEther("0.001")),
                    })
                ).to.be.revertedWithCustomError(randomIpfsNft , "RandomIpfsNft__NeedMoreETHSent")
            })
            it("emits an event and kicks off a random word request", async function () {
                const fee = await randomIpfsNft.getMintFee()
                await expect(randomIpfsNft.requestNft({ value: fee.toString() })).to.emit(
                    randomIpfsNft,
                    "NftRequested"
                )
            })
        })
        describe("fulfillRandomWords", () => {
            it("mints NFT after random number is returned", async function () {
                await new Promise(async (resolve, reject) => {

                    // (ở đây ta tạo "event listener for event NftMinted" trước ngay từ đầu rồi mới kick off the event sau)
                    randomIpfsNft.once("NftMinted", async (tokenId, breed, minter) => {
                            // event NftMinted: "event NftMinted(uint256 indexed tokenId, Breed indexed breed, address indexed minter);"
                        try {
                            const tokenUri = await randomIpfsNft.tokenURI(tokenId.toString())
                                // ("TokenURI(uint256 tokenId)" là một function của contract cha ERC721URIStorage (hay của contract cha ERC721))
                            const tokenCounter = await randomIpfsNft.getTokenCounter()
                            const dogUri = await randomIpfsNft.getDogTokenUris(breed.toString());
                            assert.equal(tokenUri.toString().includes("ipfs://"), true)
                            assert.equal(dogUri.toString(), tokenUri.toString())
                            assert.equal(+tokenCounter.toString(), +tokenId.toString() + 1)
                            assert.equal(minter, signer.address)
                            resolve()
                        } catch (e) {
                            console.log(e)
                            reject(e)
                        }
                    })

                    // (kicking off the event)
                    try {
                        const fee = await randomIpfsNft.getMintFee()
                        const requestNftResponse = await randomIpfsNft.requestNft({
                            value: fee.toString(),
                        })
                        const requestNftReceipt = await requestNftResponse.wait(1)
                        await vrfCoordinatorV2Mock.fulfillRandomWords(
                            requestNftReceipt.logs[1].args.requestId,
                            randomIpfsNft.target
                        )
                    } catch (e) {
                        console.log(e)
                        reject(e)
                    }
                })
            })
        })
        describe("getBreedFromModdedRng", () => {
            it("should return pug if moddedRng < 10", async function () {
                const expectedValue = await randomIpfsNft.getBreedFromModdedRng(7)
                assert.equal(0, expectedValue)
            })
            it("should return shiba-inu if moddedRng is between 10 - 39", async function () {
                const expectedValue = await randomIpfsNft.getBreedFromModdedRng(21)
                assert.equal(1, expectedValue)
            })
            it("should return st. bernard if moddedRng is between 40 - 99", async function () {
                const expectedValue = await randomIpfsNft.getBreedFromModdedRng(77)
                assert.equal(2, expectedValue)
            })
            it("should revert if moddedRng > 99", async function () {
                await expect(randomIpfsNft.getBreedFromModdedRng(100)).to.be.revertedWithCustomError(
                    randomIpfsNft,
                    "RandomIpfsNft__RangeOutOfBounds"
                )
            })
        })
    })


// để chạy test: "yarn hh test test\unit\randomIpfs.test.js"
    // (If you have multiple files you can do "yarn hardhat test <test\testfile.js>")