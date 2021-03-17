module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    live: {
      provider: () => new HDWalletProvider("asd", "https://node.cheapeth.org/rpc"),
      network_id: 777
    },
    development: {
      host: "https://node.cheapeth.org/rpc",
      port: 7545,
      network_id: "*" // Match any network id
    }
  },
  compilers: {
    solc: {
      version: "0.7.5"
    }
  }
};
