const { network, ethers, deployments } = require("hardhat")

module.exports = async ({ getNamedAccounts }) => {
    const { deployer } = await getNamedAccounts();
    signer = await ethers.getSigner(deployer);
    const chainId = network.config.chainId
    const _basicNft = await deployments.get("BasicNft")
    const basicNft = await ethers.getContractAt("BasicNft", _basicNft.address, signer)
    const basicMintTx = await basicNft.mintNft()
    await basicMintTx.wait(1)
    console.log(`Basic NFT index 0 tokenURI: ${await basicNft.tokenURI(0)}`)

    const _randomIpfsNft = await deployments.get("RandomIpfsNft")
    const randomIpfsNft = await ethers.getContractAt("RandomIpfsNft", _randomIpfsNft.address, signer)
    const mintFee = await randomIpfsNft.getMintFee()
    const randomIpfsNftMintTx = await randomIpfsNft.requestNft({ value: mintFee.toString() })
    const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1)
    
    await new Promise(async (resolve, reject) => {
        setTimeout(() => reject("Timeout: 'NFTMinted' event did not fire"), 300000)
        randomIpfsNft.once("NftMinted", async () => {
            console.log(`Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`)
            resolve()
        })

        if (chainId == 31337) {
            const requestId = randomIpfsNftMintTxReceipt.logs[1].args.requestId.toString()
            const _vrfCoordinatorV2Mock = await deployments.get("VRFCoordinatorV2Mock")
            const vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", _vrfCoordinatorV2Mock.address, signer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.target)
        }
    })
    
    const highValue = ethers.parseEther("4000")
    const _dynamicSvgNft = await deployments.get("DynamicSvgNft")
    const dynamicSvgNft = await ethers.getContractAt("DynamicSvgNft", _dynamicSvgNft.address, signer)
    const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue)
    await dynamicSvgNftMintTx.wait(1)
    console.log(`Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`)
}

module.exports.tags = ["all", "mint"]            