import { Networks } from './constants'

interface MarketNetworkConfig {
  address: string
  positions_per_run: number
}
export interface MarketConfig {
  workers: number
  cron_schedule: string
  networks: Partial<Record<Networks, MarketNetworkConfig>>
}

export interface NetworkConfig {
  rpcUrls: string[]
  multicall2_address: string
  ovl_state_address: string
  multicall_batch_size: number
  rpc_first_probability: number
}

export const networkConfig: Record<Networks, NetworkConfig> = {
  [Networks.BSC_MAINNET]: {
    rpcUrls: process.env.BSC_MAINNET_RPC_URLS?.split(',') || ['https://bsc-rpc.publicnode.com'],
    multicall2_address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    ovl_state_address: '0x10575a9C8F36F9F42D7DB71Ef179eD9BEf8Df238',
    multicall_batch_size: 300,
    rpc_first_probability: 1,
  },
}

export const config: Record<string, MarketConfig> = {
  'CS2 Skins': {
    workers: 1,
    cron_schedule: '15 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x5Ec437121a47B86B40FdF1aB4eF95806e60a9247',
        positions_per_run: 500,
      },
    },
  },
  'Spotify The Weeknd': {
    workers: 1,
    cron_schedule: '17 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x809E3b60cFb68d617e75ccCc8B15336dB7bAEB06',
        positions_per_run: 500,
      },
    },
  },
  'Strategic Reserve Index': {
    workers: 1,
    cron_schedule: '19 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x3fd2f14ae16919FDC7B1c3beF0cDbaA6A6B427Dc',
        positions_per_run: 500,
      },
    },
  },
  'BNB/USD': {
    workers: 1,
    cron_schedule: '21 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x6bfde86c4C5AABb614addB51bDAd1C4450bD2901',
        positions_per_run: 500,
      },
    },
  },
  'Binance Alpha Index': {
    workers: 1,
    cron_schedule: '23 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x799B52DF5394b143C7786b1E6E4533CE1De5D817',
        positions_per_run: 500,
      },
    },
  },
  'AI Index': {
    workers: 1,
    cron_schedule: '25 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xb9FB39bD8C24bd4E8eDF339a33fb5cD2eD2dd9C8',
        positions_per_run: 500,
      },
    },
  },
  'USA Index': {
    workers: 1,
    cron_schedule: '27 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x5B6a02E0Bd8Ed1D6d58368D60275F60D26e0FB55',
        positions_per_run: 500,
      },
    },
  },
  'BTC Dominance': {
    workers: 1,
    cron_schedule: '29 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x204b281d5f5a504043Ae2D91f3CF79bbBC1F6E09',
        positions_per_run: 500,
      },
    },
  },
}