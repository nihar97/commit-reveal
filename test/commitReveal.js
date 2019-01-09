const commitReveal = artifacts.require('CommitReveal');
const Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))
const deployContract = (n, stake, allowedSeconds, option1, option2) => {
    return commitReveal.new(n, stake, allowedSeconds, option1, option2)
}
const utils = require('./utils');

contract('CommitReveal', (accounts) => {
    let instance;

    beforeEach(async () => {
        instance = await deployContract(3, web3.utils.toWei("1", "ether"), 400, "Trump", "Clinton");
        assert.ok(instance)
    })

    // should close after N votes
    // should stay open until N - 1 votes
    it('should close after N votes and stay open until n-1 votes', async() => {
        await instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[0], value: web3.utils.toWei("1", "ether")});
        await instance.commitVote(web3.utils.soliditySha3("2secret2"), {from: accounts[1], value: web3.utils.toWei("1", "ether")});
        assert.isTrue(await instance.isOpen.call());
        await instance.commitVote(web3.utils.soliditySha3("2secret3"), {from: accounts[2], value: web3.utils.toWei("1", "ether")});
        assert.isFalse(await instance.isOpen.call());
    })

    // should reject a vote with stake less than s
    // should accept vote with stake exactly s
    // should reject vote with stake greater than s
    it('should handle staking correctly', async() => {
        utils.assertThrowsAsynchronously(
            () => instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[0], value: web3.utils.toWei("0.5", "ether")})
        )
        assert.ok(await instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[0], value: web3.utils.toWei("1", "ether")}));
       utils.assertThrowsAsynchronously(
           () => instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[1], value: web3.utils.toWei("2", "ether")})
       )
       
    })

    // should return stake upon reveal
    it('should return stake upon reveal', async () => {
        let balance = await web3.eth.getBalance(accounts[0]);
        let transaction1 = await instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[0], value: web3.utils.toWei("1", "ether")});
        let transaction2 = await instance.revealVote("2secret1", web3.utils.soliditySha3("2secret1"));
        let gasprice1 = (await web3.eth.getTransaction(transaction1.tx)).gasPrice
        let gasprice2 = (await web3.eth.getTransaction(transaction2.tx)).gasPrice
        let newBalance = await web3.eth.getBalance(accounts[0]);
        assert.equal(balance - (transaction1.receipt.gasUsed * gasprice1) - (transaction2.receipt.gasUsed * gasprice2), newBalance)
    })  

    // // should require reveal in time limit and return total stake divided amongst people who revealed
    // it('// should require reveal in time limit and return total stake divided amongst people who revealed', async() => {
    //     await instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[0], value: web3.utils.toWei("1", "ether")});
    //     let balance = await web3.eth.getBalance(accounts[0]);
    //     await instance.commitVote(web3.utils.soliditySha3("2secret2"), {from: accounts[1], value: web3.utils.toWei("1", "ether")});
    //     await instance.revealVote("2secret1", web3.utils.soliditySha3("2secret1"));
    //     await utils.increaseTimestamp(450);
    //     let newBalance = await web3.eth.getBalance(accounts[0]);
    //     assert.equal(newBalance, balance);
    // })

    // should resolve result upon last reveal and emit answer
    it('should resolve result upon last reveal and emit answer', async() => {
        require('truffle-test-utils').init();
        await instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[0], value: web3.utils.toWei("1", "ether")});
        await instance.commitVote(web3.utils.soliditySha3("2secret2"), {from: accounts[1], value: web3.utils.toWei("1", "ether")});
        await instance.commitVote(web3.utils.soliditySha3("2secret3"), {from: accounts[2], value: web3.utils.toWei("1", "ether")});
        await instance.revealVote("2secret1", web3.utils.soliditySha3("2secret1"));
        await instance.revealVote("2secret2", web3.utils.soliditySha3("2secret2"), {from:accounts[1]});
        let result = await instance.revealVote("2secret3", web3.utils.soliditySha3("2secret3"), {from:accounts[2]});
        assert.web3Event(result, {
            event: 'wins',
            args: {
                s1: "Winner is ",
                s2: "Clinton"
            }
        });

    })





})
