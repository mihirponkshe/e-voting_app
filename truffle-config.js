module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Accept any network ID
      gas: 6721975,
      gasPrice: 20000000000,
      confirmations: 0,
      timeoutBlocks: 50,
      skipDryRun: true
    },
    // Add localhost as backup
    localhost: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 6721975,
      gasPrice: 20000000000
    }
  },

  compilers: {
    solc: {
      version: "0.8.21",
      settings: {
        optimizer: {
          enabled: false,
          runs: 200
        },
        evmVersion: "byzantium"
      }
    }
  },

  // Configure mocha (for testing)
  mocha: {
    timeout: 100000
  }
};