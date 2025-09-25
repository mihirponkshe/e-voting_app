const Election = artifacts.require("Election");

module.exports = async function (deployer, network, accounts) {
  console.log("Deploying to network:", network);
  console.log("Deployer account:", accounts[0]);
  
  try {
    // Deploy the Election contract
    await deployer.deploy(Election, {
      from: accounts[0],
      gas: 6721975, // Increased gas limit for complex contract
      gasPrice: web3.utils.toWei('20', 'gwei')
    });
    
    const electionInstance = await Election.deployed();
    console.log("Election contract deployed at:", electionInstance.address);
    
    // Verify deployment by checking initial data
    const candidatesCount = await electionInstance.candidatesCount();
    console.log("Initial candidates count:", candidatesCount.toString());
    
    const electionInfo = await electionInstance.getElectionInfo();
    console.log("Election name:", electionInfo.name);
    console.log("Election description:", electionInfo.description);
    
    // Log all initial candidates
    console.log("\nInitial candidates:");
    for (let i = 1; i <= candidatesCount; i++) {
      const candidate = await electionInstance.getCandidate(i);
      console.log(`${i}. ${candidate.name} - ${candidate.description}`);
    }
    
    console.log("\n✅ Election contract deployment successful!");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
};