// should close after N votes
// should stay open until N - 1 votes
// should reject a vote with stake less than s
// should accept vote with stake exactly s
// should accept vote with stake greater than s
// should return stake upon reveal
// should require reveal in time limit and return total stake divided amongst people who revealed
// should resolve result upon last reveal and emit answer

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

    it('should close after N votes and stay open until n-1 votes', async() => {
        await instance.commitVote(web3.utils.soliditySha3("2secret1"), {from: accounts[0], value: web3.utils.toWei(1, "ether")});
        await instance.commitVote(web3.utils.soliditySha3("2secret2"), {from: accounts[0], value: web3.utils.toWei(1, "ether")});
        assert.isTrue(await instance.isOpen.call());
        await instance.commitVote(web3.utils.soliditySha3("2secret3"), {from: accounts[0], value: web3.utils.toWei(1, "ether")});
        assert.isFalse(await instance.isOpen.call());
    })
})
