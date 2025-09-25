// Enhanced check.js - Comprehensive Election Contract Inspector
const Web3 = require('web3');
const artifact = require('./build/contracts/Election.json');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const formatTime = (timestamp) => {
  return new Date(parseInt(timestamp) * 1000).toLocaleString();
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
};

(async () => {
  try {
    log('\n🔍 ELECTION CONTRACT INSPECTOR', colors.bright + colors.blue);
    log('=====================================', colors.blue);

    const web3 = new Web3('http://127.0.0.1:8545');
    
    // Check connection
    const isConnected = await web3.eth.net.isListening();
    if (!isConnected) {
      throw new Error('Cannot connect to Ganache. Make sure it\'s running on port 8545.');
    }
    
    const nodeNetworkId = String(await web3.eth.net.getId());
    log(`✅ Connected to network: ${nodeNetworkId}`, colors.green);

    const networks = artifact.networks || {};
    const artifactNetworkIds = Object.keys(networks);

    if (artifactNetworkIds.length === 0) {
      throw new Error('No networks found in artifact. Run: truffle migrate --reset');
    }

    let networkIdToUse = nodeNetworkId;
    if (!networks[networkIdToUse]) {
      networkIdToUse = artifactNetworkIds[artifactNetworkIds.length - 1];
      log(`⚠️  Using fallback network: ${networkIdToUse}`, colors.yellow);
    }

    const contractAddress = networks[networkIdToUse].address;
    log(`📍 Contract Address: ${contractAddress}`, colors.cyan);

    const contract = new web3.eth.Contract(artifact.abi, contractAddress);

    // 1. Get Election Information
    log('\n📊 ELECTION INFORMATION', colors.bright + colors.magenta);
    log('========================', colors.magenta);
    
    try {
      const electionInfo = await contract.methods.getElectionInfo().call();
      log(`Name: ${electionInfo.name}`, colors.green);
      log(`Description: ${electionInfo.description}`, colors.green);
      log(`Start Time: ${formatTime(electionInfo.startTime)}`, colors.green);
      log(`End Time: ${formatTime(electionInfo.endTime)}`, colors.green);
      log(`Status: ${electionInfo.active ? '🟢 Active' : '🔴 Inactive'}`, colors.green);
      log(`Total Votes Cast: ${electionInfo.totalVotesCast}`, colors.green);

      const remainingTime = await contract.methods.getRemainingTime().call();
      const remainingSeconds = parseInt(remainingTime);
      
      if (remainingSeconds > 0) {
        log(`Time Remaining: ${formatDuration(remainingSeconds)}`, colors.yellow);
      } else {
        log('⏰ Voting has ended', colors.red);
      }
    } catch (error) {
      log(`❌ Error fetching election info: ${error.message}`, colors.red);
    }

    // 2. Get Candidates Information
    log('\n👥 CANDIDATES INFORMATION', colors.bright + colors.cyan);
    log('=========================', colors.cyan);

    try {
      const candidatesData = await contract.methods.getAllCandidates().call();
      const candidatesCount = candidatesData.ids.length;
      
      log(`Total Candidates: ${candidatesCount}`, colors.green);
      
      if (candidatesCount > 0) {
        let activeCount = 0;
        let totalVotes = 0;
        
        for (let i = 0; i < candidatesCount; i++) {
          const candidate = {
            id: candidatesData.ids[i],
            name: candidatesData.names[i],
            voteCount: parseInt(candidatesData.voteCounts[i]),
            description: candidatesData.descriptions[i],
            isActive: candidatesData.activeStatus[i]
          };
          
          if (candidate.isActive) activeCount++;
          totalVotes += candidate.voteCount;
          
          const status = candidate.isActive ? '🟢 Active' : '🔴 Inactive';
          const percentage = totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : '0.0';
          
          log(`\n${candidate.id}. ${candidate.name} ${status}`, colors.bright);
          log(`   Description: ${candidate.description}`, colors.reset);
          log(`   Votes: ${candidate.voteCount} (${percentage}%)`, colors.green);
        }
        
        log(`\nActive Candidates: ${activeCount}/${candidatesCount}`, colors.yellow);
      }
    } catch (error) {
      log(`❌ Error fetching candidates: ${error.message}`, colors.red);
    }

    // 3. Get Winner Information
    log('\n🏆 WINNER INFORMATION', colors.bright + colors.yellow);
    log('=====================', colors.yellow);
    
    try {
      const winner = await contract.methods.getWinner().call();
      if (winner.winnerId !== '0') {
        log(`🎉 Winner: ${winner.winnerName}`, colors.green);
        log(`   Candidate ID: ${winner.winnerId}`, colors.green);
        log(`   Winning Votes: ${winner.winnerVotes}`, colors.green);
      } else {
        log('🤷 No winner determined yet (election may still be active)', colors.yellow);
      }
    } catch (error) {
      log(`❌ Error fetching winner: ${error.message}`, colors.red);
    }

    // 4. Get Voting Events
    log('\n📝 VOTING EVENTS', colors.bright + colors.green);
    log('================', colors.green);

    try {
      const events = await contract.getPastEvents('Voted', { 
        fromBlock: 0, 
        toBlock: 'latest' 
      });
      
      log(`Total votes recorded: ${events.length}`, colors.green);
      
      if (events.length > 0) {
        log('\nRecent votes:', colors.cyan);
        const recentEvents = events.slice(-5); // Show last 5 votes
        
        for (const event of recentEvents) {
          const { voter, candidateId, timestamp } = event.returnValues;
          const blockInfo = await web3.eth.getBlock(event.blockNumber);
          const voteTime = formatTime(blockInfo.timestamp);
          
          log(`  • Voter: ${voter}`, colors.reset);
          log(`    Candidate: ${candidateId}`, colors.reset);
          log(`    Time: ${voteTime}`, colors.reset);
          log(`    Block: ${event.blockNumber}`, colors.reset);
          log(''); // Empty line for readability
        }
        
        if (events.length > 5) {
          log(`... and ${events.length - 5} more votes`, colors.yellow);
        }
      } else {
        log('No votes recorded yet', colors.yellow);
      }
    } catch (error) {
      log(`❌ Error fetching events: ${error.message}`, colors.red);
    }

    // 5. Contract Owner Information
    log('\n👤 CONTRACT OWNER', colors.bright + colors.magenta);
    log('=================', colors.magenta);
    
    try {
      const owner = await contract.methods.owner().call();
      log(`Owner Address: ${owner}`, colors.green);
      
      const accounts = await web3.eth.getAccounts();
      if (accounts.includes(owner)) {
        const index = accounts.indexOf(owner);
        log(`Owner is Ganache Account[${index}]`, colors.green);
      }
    } catch (error) {
      log(`❌ Error fetching owner: ${error.message}`, colors.red);
    }

    // 6. Network and Gas Information
    log('\n⚙️  NETWORK INFORMATION', colors.bright + colors.blue);
    log('=======================', colors.blue);
    
    try {
      const gasPrice = await web3.eth.getGasPrice();
      const blockNumber = await web3.eth.getBlockNumber();
      const balance = await web3.eth.getBalance(contractAddress);
      
      log(`Current Block: ${blockNumber}`, colors.green);
      log(`Gas Price: ${web3.utils.fromWei(gasPrice, 'gwei')} gwei`, colors.green);
      log(`Contract Balance: ${web3.utils.fromWei(balance, 'ether')} ETH`, colors.green);
    } catch (error) {
      log(`❌ Error fetching network info: ${error.message}`, colors.red);
    }

    log('\n✅ Inspection completed successfully!', colors.bright + colors.green);

  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`, colors.bright + colors.red);
    process.exit(1);
  }
})();