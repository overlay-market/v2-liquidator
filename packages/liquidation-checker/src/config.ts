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
}