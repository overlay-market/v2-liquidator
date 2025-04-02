import dotenv from 'dotenv'

dotenv.config()

export interface Position {
  positionId: string
  owner: string
  marketAddress: string
  network: Networks
}

export enum Networks {
  ARBITRUM = "arbitrum",
}

export interface NetworksConfig {
  rpc_url: string;
  useOldMarketAbi?: boolean;
}

export const networksConfig: Record<Networks, NetworksConfig> = {
  [Networks.ARBITRUM]: {
    rpc_url: process.env.ARBITRUM_RPC_URLS?.split(',')[0] || 'https://arbitrum-sepolia-rpc.publicnode.com',
    useOldMarketAbi: true,
  },
}