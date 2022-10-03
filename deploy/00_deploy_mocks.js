const { network } = require("hardhat")
const { developmentChains, DECIMALS, INITIAL_ANSWER } = require("../helper-hardhat-config.js")

module.exports = async (hre) => {
    const { getNamedAccounts, deployments } = hre //note: 'hre' is the hardhat runtime environment

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts() // NamedAccounts can be set in harthat.config.js
    const chainId = network.config.chainId

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mock contract...")
        await deploy("MockV3Aggregator" /* not: MockV3Aggregator.sol */, {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        })
        log("Mock contract successfully deployed!")
        log("**************************************")
    }
}

module.exports.tags = ["all", "mocks"] // flag for the commandline. If provided (--tags mocks), then script will execute
