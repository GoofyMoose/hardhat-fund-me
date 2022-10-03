const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config.js")
const { verify } = require("../utils/verify.js")

module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre //note: 'hre' is the hardhat runtime environment (=require("hardhat"))
    // the above is the same as...
    //    hre.getNamedAccounts
    //    hre.deployments
    //          ...or all could be written ad: module.exports = async ({ getNamedAccounts, deployments }) => {}

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts() // NamedAccounts can be set in harthat.config.js
    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress // using 'let' so we can change the variable
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator") // constant is an object that represents the contract previously deployed
        //const ethUsdAggregator = await deployments.get("AggregatorV2V3Interface")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer, //override defaults
        args: args, //fundMe contract requires no arguments, other than for the constuctor (needs price feed contract address)
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, args)
    }
    log("********************************")
}

module.exports.tags = ["all", "fundme"]
