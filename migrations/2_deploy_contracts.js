const CommitReveal = artifacts.require('./CommitReveal.sol');
const web3 = require('web3');

module.exports = deployer => deployer.deploy(CommitReveal, 3, web3.utils.toWei("1", "ether"), 400, "Trump", "Clinton")
