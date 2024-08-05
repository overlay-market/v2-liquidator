import dotenv from 'dotenv'

dotenv.config()

export interface Market {
  address: string;
  init_block: string;
}

export enum Networks {
  ARBITRUM = "arbitrum",
  BERACHAIN = "berachain",
  MOVEMENT = "movement",
}

export interface NetworksConfig {
  rpc_url: string;
  fork_rpc_url: string;
  markets: Record<string, Market>;
  enabled: boolean;
  blockStep: number; // for big networks 45000 is a good value; for small networks 10000
  useFork: boolean;
  useOldMarketAbi?: boolean;
}

export const networksConfig: Record<Networks, NetworksConfig> = {
  [Networks.ARBITRUM]: {
    rpc_url: process.env.ARBITRUM_RPC_URLS?.split(',')[0] || 'https://arbitrum-sepolia-rpc.publicnode.com',
    fork_rpc_url: process.env.ARBITRUM_FORK_RPC_URL?.split(',')[0] || 'https://arbitrum-sepolia-rpc.publicnode.com',
    markets: {
      'ETH Dominance': {
        address: '0x3a204d03e9B1fEE01b8989333665b6c46Cc1f79E',
        init_block: '12600256',
      },
      'BTC Dominance': {
        address: '0x553de578e68a4faa55d4522665cb2d2d53390d22',
        init_block: '2163024',
      },
      'Quantum Cats': {
        address: '0x4EDFB4057F3a448B2704dF1A3665Db4AE6371B69',
        init_block: '16499215',
      },
      'CS2 Skins': {
        address: '0x6aa41b8f2f858723aafcf388a90d34d1cb1162d9',
        init_block: '1590839',
      },
      'Bitcoin Frogs': {
        address: '0xC7f3240d983fcAB7A571bE484d2b4dA43B95efEe',
        init_block: '16498932',
      },
      'Ink': {
        address: '0xe060ea13b2e710cefc5124bb790db4823b0f602a',
        init_block: '29178446',
      },
      'NodeMonkes': {
        address: '0xef898dbf4F4D75bdfbDd85F781A6C1BF8EDaF0AE',
        init_block: '16499121',
      },
      'EvIndex': {
        address: '0x770E3A8afC5c01855b5bD8EB5b96b23bd7Af1e43',
        init_block: '48459493',
      },
      'AiIndex': {
        address: '0xad90fFf9D159e18CEc2048Dd6881e29886e4899E',
        init_block: '54018512',
      },
      'EthSol': {
        address: '0x3966f792517E2Df998C48301163c2A95BFd3efF8',
        init_block: '58877180',
      }
    },
    enabled: true,
    blockStep: 45000,
    useFork: true,
    useOldMarketAbi: true,
  },
  [Networks.BERACHAIN]: {
    rpc_url: process.env.BERACHAIN_RPC_URLS?.split(',')[0] || 'https://bartio.rpc.berachain.com/',
    fork_rpc_url: process.env.BERACHAIN_FORK_RPC_URL?.split(',')[0] || 'https://bartio.rpc.berachain.com/',
    markets: {
      'BTC Dominance': {
        address: '0x796CC71ad083e27675530d9acb1ad1632c66eE5a',
        init_block: '1839362',
      },
    },
    enabled: true,
    blockStep: 5000,
    useFork: true,
  },
  [Networks.MOVEMENT]: {
    rpc_url: process.env.MOVEMENT_RPC_URLS?.split(',')[0] || 'https://mevm.devnet.imola.movementlabs.xyz',
    fork_rpc_url: process.env.MOVEMENT_FORK_RPC_URL?.split(',')[0] || 'https://mevm.devnet.imola.movementlabs.xyz',
    markets: {
      'BTC Dominance': {
        address: '0xB021EB4489c230234567Ca6789e53403310Db090',
        init_block: '308279',
      },
      'ETH Dominance': {
        address: '0xeab2fbdc9d43e785eb4065c8447d872735729aac',
        init_block: '645447',
      },
    },
    enabled: true,
    blockStep: 2000,
    useFork: false,
  },
}

export enum EventType {
  Build = 'Build',
  Unwind = 'Unwind',
  Liquidate = 'Liquidate',
  CacheRiskCalc = 'CacheRiskCalc',
  EmergencyWithdraw = 'EmergencyWithdraw',
  Paused = 'Paused',
  Unpaused = 'Unpaused',
  Update = 'Update',
}

export enum PositionStatus {
  New = 'New',
  Updated = 'Updated',
  Removed = 'Removed',
  OtherEvent = 'OtherEvent',
  Error = 'Error',
}