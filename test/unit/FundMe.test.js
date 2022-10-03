const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe //will store the latest deployed contract
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1") // 1 ETH

          // first we deploy our FundMe contract using Hardhat-deploy
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer // same as: const { deployer } = await getNamedAccounts()
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
          })

          // then we test our constructor function
          describe("constructor", async function () {
              it("Sets the aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed() // calls getter function of state variable 's_priceFeed'
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          // test the fund() function (this requires multiple tests)
          describe("fund()", async function () {
              it("Fails if the amount sent is less than the minimum.", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith("Amount sent is below minimum.") // transaction amount is empty
              })

              // test the mapping containing the funders addresses and respective amounts sent
              it("Updates s_addressToAmountFunded mapping when a value is provided.", async function () {
                  await fundMe.fund({ value: sendValue }) // execute function
                  const response = await fundMe.getAddressToAmountFunded(deployer)
                  await assert.equal(response.toString(), sendValue.toString())
              })

              // test the list/array of funders
              it("Updates the funders array.", async function () {
                  await fundMe.fund({ value: sendValue }) // execute function
                  const response = await fundMe.getFunder(0)
                  await assert.equal(response, deployer)
              })
          })

          // test the withdraw() function
          describe("withdraw()", async function () {
              // send ETH before each test
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })

              // Withdraw works if there is only one funder
              it("Allows to withdraw if there is a single funder.", async function () {
                  // Arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // use .mul() function instead of * because we're dealing with BigNumbers

                  const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                  const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingDeployerBalance.add(startingFundMeBalance).toString()
                  )
                  // use .add() instead of + because we are dealing with BigNumbers (see ethers documentation)
                  // convert all toString to ensure comparison will work
                  // don't forget to account for gas cost
              })

              // Withdraw works if there are multiple funders
              it("Withdraw works if there are multiple funders.", async function () {
                  // Arrange
                  // send ETH from different accounts
                  const accounts = await ethers.getSigners() // not: provider.getSigners(), because 'ethers' is the hardhat ethers

                  // loop through accounts; starts at 1 because 0 is the deployer
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(accounts[i])
                      await fundMeConnectedContract.fund({ value: sendValue }) // execute fund() function for each account
                  }
                  const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // use .mul() function instead of * because we're dealing with BigNumbers

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                  const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingDeployerBalance.add(startingFundMeBalance).toString()
                  )

                  // Make sure that the list of funders is reset (empty)
                  await expect(fundMe.getFunder(0)).to.be.reverted // reading from the zero'th position should throw an error
                  //assert.equal(await fundMe.getFunder.length, 0)

                  // Ensure that amounts in account mapping are set to zero
                  for (let i = 1; i < 6; i++) {
                      assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
                  }
              })

              // Only owner can withdraw
              it("Only the owner can withdraw.", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(attacker)
                  //const transactionResponse = await attackerConnectedContract.withdraw()
                  //const transactionReceipt = await transactionResponse.wait(1)
                  await expect(attackerConnectedContract.withdraw()).to.be.revertedWithCustomError(
                      // note: revertedWith() is for string errors, not custom errors
                      attackerConnectedContract,
                      "FundMe__NotOwner"
                  )
              })

              // Same test (multiple funders) but with cheaperWithdraw() function
              it("CheaperWithdraw test.", async function () {
                  // Arrange
                  // send ETH from different accounts
                  const accounts = await ethers.getSigners() // not: provider.getSigners(), because 'ethers' is the hardhat ethers

                  // loop through accounts; starts at 1 because 0 is the deployer
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(accounts[i])
                      await fundMeConnectedContract.fund({ value: sendValue }) // execute fund() function for each account
                  }
                  const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice) // use .mul() function instead of * because we're dealing with BigNumbers

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                  const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingDeployerBalance.add(startingFundMeBalance).toString()
                  )

                  // Make sure that the list of funders is reset (empty)
                  await expect(fundMe.getFunder(0)).to.be.reverted // reading from the zero'th position should throw an error
                  //assert.equal(await fundMe.getFunder.length, 0)

                  // Ensure that amounts in account mapping are set to zero
                  for (let i = 1; i < 6; i++) {
                      assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
                  }
              })
          })
      })
