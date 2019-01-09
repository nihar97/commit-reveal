const commitReveal = artifacts.require('CommitReveal');
const web3 = commitReveal.web3;
const deployContract = (n, stake, allowedSeconds, option1, option2) => {
    return commitReveal.new(n, stake, allowedSeconds, option1, option2)
}
const utils = require('./utils');

contract('CommitReveal', (accounts) => {
    let instance;

    beforeEach(async () => {
        instance = await deployContract(3, web3.utils.toWei(1, "ether"), 20, "Trump", "Clinton");
        assert.ok(instance)
    })

    // should close after N votes
    // should stay open until N - 1 votes
    it('should close after N votes and stay open until n-1 votes', async() => {
        await instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[0], value: web3.utils.toWei(1, "ether")});
        await instance.commitVote(web3.utils.soliditySha3("2secret2"), {from: accounts[1], value: web3.utils.toWei(1, "ether")});
        assert.isTrue(await instance.isOpen.call());
        await instance.commitVote(web3.utils.soliditySha3("2secret3"), {from: accounts[2], value: web3.utils.toWei(1, "ether")});
        assert.isFalse(await instance.isOpen.call());
    })

    // should reject a vote with stake less than s
    // should accept vote with stake exactly s
    // should accept vote with stake greater than s
    it('should handle staking correctly', async() => {
        utils.assertThrowsAsynchronously(
            () => instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[0], value: web3.utils.toWei(0.5, "ether")})
        )
        assert.ok(await instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[0], value: web3.utils.toWei(1, "ether")}));
        assert.ok(instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[1], value: web3.utils.toWei(2, "ether")}));
    })

    // should return stake upon reveal
    it('should return stake upon reveal', async () => {
        let balance = utils.balanceOf(web3, accounts[0]);
        await instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[0], value: web3.utils.toWei(1, "ether")});
        await instance.revealVote("2secret1", web3.utils.soliditySha3("2secret1"));
        let newBalance = utils.balanceOf(web3, accounts[0]);
        assert.equal(balance, newBalance)
    })

    // should require reveal in time limit and return total stake divided amongst people who revealed
    it('// should require reveal in time limit and return total stake divided amongst people who revealed', async() => {
        await instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[0], value: web3.utils.toWei(1, "ether")});
        let balance = utils.balanceOf(web3, accounts[0]);
        await instance.commitVote(web3.utils.soliditySha3("2secret2"), {from: accounts[1], value: web3.utils.toWei(1, "ether")});
        await instance.revealVote("2secret1", web3.utils.soliditySha3("2secret1"));
        await utils.increaseTimestamp(web3, 25);
        let newBalance = utils.balanceOf(web3, accounts[0]);
        assert.isAbove(newBalance, balance);
    })

    // should resolve result upon last reveal and emit answer
    it('should resolve result upon last reveal and emit answer', async() => {
        require('truffle-test-utils').init();
        await instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[0], value: web3.utils.toWei(1, "ether")});
        await instance.commitVote(web3.utils.soliditySha3("2secret2"), {from: accounts[1], value: web3.utils.toWei(1, "ether")});
        await instance.commitVote(web3.utils.soliditySha3("2secret3"), {from: accounts[2], value: web3.utils.toWei(1, "ether")});
        await instance.revealVote("2secret1", web3.utils.soliditySha3("2secret1"));
        await instance.revealVote("2secret2", web3.utils.soliditySha3("2secret2"), {from:accounts[1]});
        let result = await instance.revealVote("2secret3", web3.utils.soliditySha3("2secret3"), {from:accounts[2]});
        assert.web3Event(result, {
            event: 'winner',
            args: {
                s1: "Winner is ",
                s2: "Clinton"
            }
        });
        
    })





})
