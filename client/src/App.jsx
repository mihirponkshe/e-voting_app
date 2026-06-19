import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import ElectionArtifact from './contracts/Election.json'

function App() {
  const [account, setAccount] = useState('')
  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  
  const [electionInfo, setElectionInfo] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [voterInfo, setVoterInfo] = useState({ hasVoted: false, votedFor: 0 })

  const [error, setError] = useState('')

  useEffect(() => {
    checkIfWalletIsConnected()
  }, [])

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        setLoading(false)
        return
      }

      // Check if we're connected to the right network (Ganache)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      
      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      
      if (accounts.length > 0) {
        setAccount(accounts[0])
        initContract(provider)
      } else {
        setLoading(false)
      }

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          initContract(new ethers.BrowserProvider(window.ethereum))
        } else {
          setAccount('')
          setContract(null)
        }
      })
    } catch (error) {
      console.error(error)
      setError("Failed to connect to wallet.")
      setLoading(false)
    }
  }

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("Please install MetaMask to use this application.")
        return
      }
      
      setLoading(true)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAccount(accounts[0])
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      initContract(provider)
    } catch (error) {
      console.error(error)
      setError("Failed to connect wallet. " + error.message)
      setLoading(false)
    }
  }

  const initContract = async (provider) => {
    try {
      const signer = await provider.getSigner()
      const network = await provider.getNetwork()
      
      // Get network ID from Ganache (usually 1337 or 5777, we used 1337)
      const networkId = await window.ethereum.request({ method: 'net_version' })
      const networkData = ElectionArtifact.networks[networkId]
      
      if (networkData) {
        const electionContract = new ethers.Contract(
          networkData.address,
          ElectionArtifact.abi,
          signer
        )
        setContract(electionContract)
        loadElectionData(electionContract, signer.address)
      } else {
        setError(`Smart contract not deployed to detected network (ID: ${networkId}). Please switch to Ganache (Localhost 8545).`)
        setLoading(false)
      }
    } catch (error) {
      console.error(error)
      setError("Failed to initialize contract.")
      setLoading(false)
    }
  }

  const loadElectionData = async (electionContract, currentAccount) => {
    try {
      setLoading(true)
      
      // 1. Get Election Info
      const info = await electionContract.getElectionInfo()
      setElectionInfo({
        name: info.name,
        description: info.description,
        active: info.active,
        totalVotes: Number(info.totalVotesCast)
      })

      // 2. Get Voter Info
      const vInfo = await electionContract.getVoterInfo(currentAccount)
      setVoterInfo({
        hasVoted: vInfo.hasVoted,
        votedFor: Number(vInfo.votedFor)
      })

      // 3. Get All Candidates
      const [ids, names, voteCounts, descriptions, activeStatuses] = await electionContract.getAllCandidates()
      
      const formattedCandidates = ids.map((id, index) => ({
        id: Number(id),
        name: names[index],
        voteCount: Number(voteCounts[index]),
        description: descriptions[index],
        isActive: activeStatuses[index]
      }))
      
      setCandidates(formattedCandidates.filter(c => c.isActive))
      setLoading(false)
    } catch (error) {
      console.error("Error loading election data:", error)
      setError("Failed to load election data. Please make sure the contract is deployed.")
      setLoading(false)
    }
  }

  const castVote = async (candidateId) => {
    if (!contract || !electionInfo?.active) return
    
    try {
      setVoting(true)
      setError('')
      
      const tx = await contract.vote(candidateId)
      await tx.wait() // Wait for transaction to be mined
      
      // Reload data after successful vote
      await loadElectionData(contract, account)
      
    } catch (error) {
      console.error(error)
      // Extract error message
      let errorMsg = "Transaction failed."
      if (error.reason) errorMsg = error.reason
      else if (error.message.includes("user rejected")) errorMsg = "Transaction rejected by user."
      else if (error.data?.message) errorMsg = error.data.message
      setError(errorMsg)
    } finally {
      setVoting(false)
    }
  }

  // Render loading state
  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Connecting to blockchain...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <header className="glass-panel">
        <h1>VoteChain</h1>
        <div>
          {account ? (
            <div className="wallet-address">
              Connected: {account.substring(0, 6)}...{account.substring(38)}
            </div>
          ) : (
            <button className="btn btn-accent" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <main className="container">
        {error && (
          <div className="alert alert-warning">
            {error}
          </div>
        )}

        {!account ? (
          <div className="glass-panel dashboard">
            <h2>Welcome to Decentralized Voting</h2>
            <p>Please connect your Web3 wallet (like MetaMask) to view the election and cast your vote securely on the blockchain.</p>
            <button className="btn btn-accent" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Dashboard Overview */}
            {electionInfo && (
              <div className="glass-panel dashboard">
                <h2>{electionInfo.name}</h2>
                <p>{electionInfo.description}</p>
                
                <div className="stats">
                  <div className="stat-box">
                    <div className="stat-value">{electionInfo.totalVotes}</div>
                    <div className="stat-label">Total Votes Cast</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{candidates.length}</div>
                    <div className="stat-label">Candidates</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value" style={{ color: electionInfo.active ? '#34d399' : '#ef4444' }}>
                      {electionInfo.active ? 'Live' : 'Ended'}
                    </div>
                    <div className="stat-label">Status</div>
                  </div>
                </div>
              </div>
            )}

            {/* Voter Status */}
            {voterInfo.hasVoted && (
              <div className="alert alert-success">
                ✅ You have successfully cast your vote for Candidate #{voterInfo.votedFor}. Thank you for participating!
              </div>
            )}

            {/* Candidates Grid */}
            <div className="candidates-grid">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="glass-panel candidate-card">
                  <div className="candidate-header">
                    <h3 className="candidate-name">{candidate.name}</h3>
                    <span className="candidate-id">#{candidate.id}</span>
                  </div>
                  <p className="candidate-desc">{candidate.description}</p>
                  
                  <div className="candidate-footer">
                    <div>
                      <span className="vote-count">{candidate.voteCount}</span>
                      <span className="vote-label">votes</span>
                    </div>
                    
                    {!voterInfo.hasVoted && electionInfo?.active && (
                      <button 
                        className="btn btn-accent" 
                        onClick={() => castVote(candidate.id)}
                        disabled={voting}
                      >
                        {voting ? 'Voting...' : 'Vote'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App
