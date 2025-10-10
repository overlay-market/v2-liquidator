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
  [Networks.BSC_TESTNET]: {
    rpcUrls: process.env.BSC_TESTNET_RPC_URLS?.split(',') || ['https://bsc-testnet-rpc.publicnode.com'],
    multicall2_address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    ovl_state_address: '0x3A6892e5da2f87F3865aA1aEA2fcaCCE27C44ea8',
    multicall_batch_size: 300,
    rpc_first_probability: 1,
  },
}

export const config: Record<string, MarketConfig> = {
    'double-nothing': {
    workers: 1,
    cron_schedule: '15 */2 * * * *',
    networks: {
      [Networks.BSC_TESTNET]: {
        address: '0x4290ab292560d27B605da10c24FBCDeda434697c',
        positions_per_run: 500,
      },
    },
  },

}
