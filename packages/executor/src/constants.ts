import dotenv from 'dotenv'

dotenv.config()

export interface Position {
  positionId: string
  owner: string
  marketAddress: string
  network: Networks
  lastErrorType?: string
}

export enum Networks {
  BSC_TESTNET = "bsc_testnet",
}

export interface NetworksConfig {
  rpc_url: string;
  useOldMarketAbi?: boolean;
}

export const networksConfig: Record<Networks, NetworksConfig> = {
  [Networks.BSC_TESTNET]: {
    rpc_url: process.env.BSC_TESTNET_EXECUTOR_RPC_URL || 'https://bsc-testnet-rpc.publicnode.com',
  },
}