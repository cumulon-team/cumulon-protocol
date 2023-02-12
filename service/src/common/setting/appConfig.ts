import { ParachainNetwork } from "../chain/chain-network";

//
export const PORTAL_DB_CONFIG = {
  type: "postgres",
  host: "",
  password: "",
  synchronize: false,
  logging: false,
  port: 5432,
  username: "postgres",
  database: "dev-cumulon-protocol",
};

// CURRENT SUPPORTED CHAIN NETWORKS FOR the Go Staking Portal data acess from the network or the indexed database
export const parachainNetworks: Array<ParachainNetwork> = [
  {
    info: {
      id: "litentry",
      decimals: [12],
      displayName: "Litentry Network",
      network: "litentry",
      prefix: 31,
      standardAccount: "*25519",
      symbols: ["LIT"],
      website: "https://litentry.com/",
      wssEndpoints: [
        "wss://litentry-rpc.dwellir.com",
        "wss://rpc.litentry-parachain.litentry.io",
      ],
    },
    defaultValues: {
      minBond: 50,
      collatorSafeStateThreshold: 0.9
    },
    dbConfig: {
      type: "postgres",
      host: "",
      port: 5432,
      username: "",
      password: "",
      synchronize: false,
      logging: false,
      database: "prod-litentry-mainnet-staking",
    },
  },
  {
    info: {
      id: "calamari",
      decimals: [12],
      displayName: "Calamari: Manta Canary Network",
      network: "calamari",
      prefix: 78,
      standardAccount: "*25519",
      symbols: ["KMA"],
      website: "https://manta.network",
      wssEndpoints: ["wss://ws.calamari.systems/"],
    },
    defaultValues: {
      minBond: 5000,
      collatorSafeStateThreshold: 0.9,
    },
    dbConfig: {
      type: "postgres",
      host: "",
      port: 5432,
      username: "",
      password: "",
      synchronize: false,
      logging: false,
      database: "prod-calamari-mainnet-staking",
    },
  },
  {
    info: {
      id: "turing",
      decimals: [10],
      displayName: "Turing Network",
      network: "turing",
      prefix: 51,
      standardAccount: "*25519",
      symbols: ["TUR"],
      website: "https://oak.tech/",
      // wssEndpoints: ['wss://rpc.turing-staging.oak.tech'],
      wssEndpoints: ["wss://rpc.turing.oak.tech"],
    },
    defaultValues: {
      minBond: 50,
      collatorSafeStateThreshold: 0.9,
    },
    dbConfig: {
      type: "postgres",
      host: "",
      port: 5432,
      username: "",
      password: "",
      synchronize: false,
      logging: false,
      database: "prod-oak-staking",
    },
  },

  {
    info: {
      id: "bifrost",
      decimals: [12],
      displayName: "Bifrost",
      network: "bifrost",
      prefix: 6,
      standardAccount: "*25519",
      symbols: ["BNC"],
      website: "https://bifrost.finance/",
      wssEndpoints: ["wss://bifrost-rpc.liebi.com/ws"],
    },
    defaultValues: {
      minBond: 50,
      collatorSafeStateThreshold: 0.9,
    },
    dbConfig: {
      type: "postgres",
      host: "",
      port: 5432,
      username: "",
      password: "",
      synchronize: false,
      logging: false,
      database: "prod-bifrost-staking",
    },
  },

  {
    info: {
      id: "moonbeam",
      decimals: [18],
      displayName: "Moonbeam",
      network: "moonbeam",
      prefix: 1284,
      standardAccount: "secp256k1",
      symbols: ["GLMR"],
      website: "https://moonbeam.network",
      wssEndpoints: [
        {external: true, url: "ws://16.163.221.27:9944"},
        "wss://wss.api.moonbeam.network"],
    },
    defaultValues: {
      minBond: 5,
      collatorSafeStateThreshold: 0.9,
    },
    dbConfig: {
      type: "postgres",
      host: "",
      port: 5432,
      username: "",
      password: "",
      synchronize: false,
      logging: false,
      database: "prod-moonbeam-staking",
    },
  },

  {
    info: {
      id: "moonriver",
      decimals: [18],
      displayName: "Moonriver",
      network: "moonriver",
      prefix: 1285,
      standardAccount: "secp256k1",
      symbols: ["MOVR"],
      website: "https://moonbeam.network",
      wssEndpoints: [
        {external: true, url: "ws://3.1.235.180:9944"},
        "wss://wss.api.moonriver.moonbeam.network"],
    },
    defaultValues: {
      minBond: 5,
      collatorSafeStateThreshold: 0.9,
    },
    dbConfig: {
      type: "postgres",
      host: "",
      port: 5432,
      username: "",
      password: "",
      synchronize: false,
      logging: false,
      database: "prod-moonriver-staking",
    },
  },
];

 
