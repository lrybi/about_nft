const { network, ethers } = require("hardhat");
const { networkConfig, developmentChains } = require("../helper-hardhat-config");

const { verify } = require("../utils/verify");
const { storeNFTs } = require('../utils/uploadToNftStorage');

require("dotenv").config();const VRF_SUB_FUND_AMOUNT = "1000000000000000000000";
const imageLocation = './images/randomNFT/';

let tokenURIs = [];

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
        
    const { deployer } = await getNamedAccounts();
    const signer = await ethers.getSigner(deployer);
    const chainId = network.config.chainId;
    if (process.env.UPLOAD_TO_NFT_STORAGE == "true") {
        tokenURIs = await handleTokenURIs();
        console.log(tokenURIs);
    }
    
    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock;
    if (developmentChains.includes(network.name)) {
        const _vrfCoordinatorV2Mock = await deployments.get("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = _vrfCoordinatorV2Mock.address;
        vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", vrfCoordinatorV2Address, signer);
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
        const transactionReceipt = await transactionResponse.wait(1);
        subscriptionId = transactionReceipt.logs[0].args.subId;
        vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT);
    } else { 
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
        subscriptionId = networkConfig[chainId]["subscriptionId"]
            
    }

    const mintFee = networkConfig[chainId]["mintFee"];
    
    const gasLane = networkConfig[chainId]["gasLane"];
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];

    const args = [vrfCoordinatorV2Address, gasLane, subscriptionId, callbackGasLimit, tokenURIs, mintFee];
    const randomIpfsNft = await deploy("RandomIpfsNft", {
        contract: "RandomIpfsNft",
        from: deployer,
        args: args, 
        log: true, 
        waitConfirmaions: network.config.blockConfirmations || 1,    }); 
    log('RandomIpfsNft Deployed!');
    if (developmentChains.includes(network.name)) {
        await (vrfCoordinatorV2Mock).addConsumer(subscriptionId, randomIpfsNft.address);
    
        log('Consumer is added');
      }

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) { 
        log("Verifying...");
        await verify(await randomIpfsNft.address, args); 
    }
    log("------------------------------------------");
}
async function handleTokenURIs() {
    const imageUploadResponse = await storeNFTs(imageLocation);
    console.log(imageUploadResponse);
    for (imageUploadResponseIndex in imageUploadResponse) {
        
        const url = imageUploadResponse[imageUploadResponseIndex].url;
        tokenURIs.push(url);
    }
    
    console.log("(có thể truy cập đến: https://nft.storage/files/ - (bản trước đó đổi thành https://classic.nft.storage/files/))");
    return tokenURIs;
}

module.exports.tags = ["all", "randomipfsnft", "main", "mock+randomipfsnft"];