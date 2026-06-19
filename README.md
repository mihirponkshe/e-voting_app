# Blockchain Voting DApp

A decentralized voting application built on Ethereum blockchain using Solidity smart contracts, Truffle framework, and React frontend with Web3 integration.

##  Architecture

### Smart Contract (`Election.sol`)
- **Solidity Version**: ^0.8.21
- **Network**: Ethereum (Local Ganache)
- **Features**: Voting logic, candidate management, time controls, winner calculation

### Frontend (`React App`)
- **Framework**: React.js with Web3 integration
- **Web3 Provider**: MetaMask or Ganache RPC
- **Real-time Updates**: Automatic refresh of voting data
- **Responsive Design**: Mobile-friendly interface

### Development Tools
- **Truffle**: Smart contract compilation and deployment
- **Ganache**: Local blockchain for testing
- **Web3.js**: Blockchain interaction library

##  Installation & Setup

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Git
- MetaMask browser extension (optional)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/blockchain-voting-dapp.git
cd blockchain-voting-dapp
```

### 2. Install Dependencies
```bash
# Install Truffle and Ganache globally
npm install -g truffle ganache-cli

# Install project dependencies
npm install

# Install React dependencies
cd client
npm install
cd ..
```

### 3. Start Local Blockchain
```bash
# Start Ganache with fixed network ID
ganache-cli --port 8545 --networkId 1337 --deterministic
```

### 4. Deploy Smart Contracts
```bash
# Compile and deploy contracts
truffle migrate --reset --network development

# Copy contract artifacts to React app
Copy-Item -Force .\build\contracts\Election.json .\client\src\contracts\Election.json
# For Linux/Mac: cp ./build/contracts/Election.json ./client/src/contracts/Election.json
```

### 5. Start React Application
```bash
cd client
npm start
```

The application will open at `http://localhost:3005`

##  Configuration Files

### `truffle-config.js`
- Network configuration for local development
- Compiler settings for Solidity
- Gas limits and pricing

### `package.json`
- Node.js dependencies
- Build scripts
- Project metadata

##  How It Works

### Smart Contract Layer
1. **Election Contract**: Core voting logic with candidate management
2. **Voter Registry**: Tracks voting status to prevent double voting
3. **Time Controls**: Enforces voting periods with start/end times
4. **Event Emission**: Records all voting activities on blockchain

### Frontend Layer
1. **Web3 Integration**: Connects to blockchain via MetaMask or Ganache
2. **Contract Interaction**: Calls smart contract methods for voting
3. **Real-time Updates**: Automatically refreshes data every 30 seconds
4. **Error Handling**: User-friendly error messages for failed transactions

##  Testing & Verification

### Manual Testing
```bash
# Run contract inspection
node check.js
```

### Automated Tests
```bash
# Run Truffle tests
truffle test
```

##  Network Configuration

### Local Development (Ganache)
- **Network ID**: 1337
- **RPC URL**: http://127.0.0.1:8545
- **Gas Limit**: 30,000,000
- **Gas Price**: 2 gwei

##  Technology Stack

- **Blockchain**: Ethereum
- **Smart Contracts**: Solidity 0.8.21
- **Development Framework**: Truffle Suite
- **Frontend**: React.js
- **Web3 Library**: Web3.js
- **Local Blockchain**: Ganache CLI
- **Wallet Integration**: MetaMask

---
