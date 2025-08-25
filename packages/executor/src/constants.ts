import dotenv from 'dotenv'

dotenv.config()

export interface Position {
  positionId: string
  owner: string
  marketAddress: string
  network: Networks
}

export enum Networks {
  BSC_MAINNET = "bsc_mainnet",
}

export interface NetworksConfig {
  rpc_url: string;
  useOldMarketAbi?: boolean;
}

export const networksConfig: Record<Networks, NetworksConfig> = {
  [Networks.BSC_MAINNET]: {
    rpc_url: process.env.BSC_MAINNET_EXECUTOR_RPC_URL || 'https://bsc-rpc.publicnode.com',
  },
}