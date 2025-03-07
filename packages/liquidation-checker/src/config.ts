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
  [Networks.BERACHAIN]: {
    rpcUrls: process.env.BERACHAIN_RPC_URLS?.split(',') || ['https://rpc.berachain.com/'],
    multicall2_address: '0xDe9D8f9d9d2B276Dd5B921211AcB918d33Ed0B6C',
    ovl_state_address: '0x4f69Dfb24958fCf69b70BcA73c3E74F2c82BB405',
    multicall_batch_size: 300,
    rpc_first_probability: 1,
  },
}

export const config: Record<string, MarketConfig> = {}