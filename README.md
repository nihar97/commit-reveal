```bash
npm install
truffle develop
test
```
Known errors:
1) Test 3 fails non-deterministically because of gas calculations
2) Test 4 needs to be able to increasetimestamp.
3) Contract allows one person to vote more than once. Need to add check for that.
4) Documentation, more tests and linting would be helpful.
5) Made decision to allow users to reveal before all votes are committed. Also reveals winner even if all votes haven't been revealed.