// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle")
require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy") // runs all .js in folder 'deploy' using command: yarn hardhat deploy
require("@nomiclabs/hardhat-solhint")
require("@nomicfoundation/hardhat-chai-matchers")

//const GOERLI_RPC_URL = process.GOERLI_RPC_URL; // does not work: expects value of type string
const GOERLI_RPC_URL =
    process.env.GOERLI_RPC_URL || "https://eth-goerli.g.alchemy.com/v2/6ZcBhOHNaLTinBfCrgDLBL5c3qw4UTmy"
const GOERLI_PRIVATE_KEY =
    process.env.GOERLI_PRIVATE_KEY || "5f5b0ae2c3603a00f95a3759acd9f1369ed4cb363427b596b8daa5c041c99d63"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "MH1VIYAQGRFCT6AS7MVCVXYDHTVNJ3FJBV"

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat", // provides rpc_url and private_key automatically
    networks: {
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [GOERLI_PRIVATE_KEY],
            chainId: 5,
            blockConfirmations: 5,
            //timeout: 60000, //override default timeout: 60 sec.
        },
        localhost: {
            url: "http://localhost:8545",
            chainId: 31337,
        },
    },
    //solidity: "0.8.9",
    solidity: {
        compilers: [
            {
                version: "0.8.8",
            },
            {
                version: "0.8.9",
            },
            {
                version: "0.6.6",
            },
        ],
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        //coinmarketcap: COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
    },
    mocha: {
        timeout: 500000,
    },
}
