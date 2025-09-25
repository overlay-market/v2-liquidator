import dotenv from 'dotenv'

dotenv.config()

export interface Market {
  address: string;
  init_block: string;
}

export enum Networks {
  BSC_MAINNET = "bsc_mainnet",
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
  [Networks.BSC_MAINNET]: {
    rpc_url: process.env.BSC_MAINNET_RPC_URLS?.split(',')[0] || 'https://bsc-rpc.publicnode.com',
    fork_rpc_url: process.env.BSC_MAINNET_FORK_RPC_URLS?.split(',')[0] || 'https://bsc-rpc.publicnode.com',
    markets: {
      'CS2 Skins': {
        address: '0x5Ec437121a47B86B40FdF1aB4eF95806e60a9247',
        init_block: '56097602',
      },
      'Spotify The Weeknd': {
        address: '0x809E3b60cFb68d617e75ccCc8B15336dB7bAEB06',
        init_block: '57245536',
      },
      'Strategic Reserve Index': {
        address: '0x3fd2f14ae16919FDC7B1c3beF0cDbaA6A6B427Dc',
        init_block: '57245536',
      },
      'BNB/USD': {
        address: '0x6bfde86c4C5AABb614addB51bDAd1C4450bD2901',
        init_block: '57245536',
      },
      'Binance Alpha Index': {
        address: '0x799B52DF5394b143C7786b1E6E4533CE1De5D817',
        init_block: '57372370',
      },
      'AI Index': {
        address: '0xb9FB39bD8C24bd4E8eDF339a33fb5cD2eD2dd9C8',
        init_block: '58502607',
      },
      'USA Index': {
        address: '0x5B6a02E0Bd8Ed1D6d58368D60275F60D26e0FB55',
        init_block: '58942999',
      },
      'BTC Dominance': {
        address: '0x204b281d5f5a504043Ae2D91f3CF79bbBC1F6E09',
        init_block: '58942999',
      },
      'BTC/USD': {
        address: '0x3d9701e8fE563D82c3787b3a783d8a218591E4A3',
        init_block: '59986521',
      },
      'ETH/USD': {
        address: '0x6aB3469c76ADf1eEF65EE105dac1093c130468BA',
        init_block: '59986521',
      },
      'SOL/USD': {
        address: '0x23cEfE1C6ea3c067F9500c8D9961baf01C39Ce3E',
        init_block: '59986521',
      },
      'Aster/MYX': {
        address: '0x377d6e6647189aa7ea9a5e12f4bdc7ecaebb7d45',
        init_block: '62329518',
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
