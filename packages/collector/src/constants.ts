import dotenv from 'dotenv'

dotenv.config()

export interface Market {
  address: string;
  init_block: string;
}

export enum Networks {
  BSC_TESTNET = "bsc_testnet",
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
  [Networks.BSC_TESTNET]: {
    rpc_url: process.env.BSC_TESTNET_RPC_URLS?.split(',')[0] || 'https://bsc-testnet-rpc.publicnode.com',
    fork_rpc_url: process.env.BSC_TESTNET_FORK_RPC_URLS?.split(',')[0] || 'https://bsc-testnet-rpc.publicnode.com',
    markets: {
      'double-nothing': {
        address: '0x4290ab292560d27B605da10c24FBCDeda434697c',
        init_block: '68022753',
      },

    },
    enabled: true,
    blockStep: 5000,
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
