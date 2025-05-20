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
  BERACHAIN = "berachain",
  BSC_TESTNET = "bsc_testnet",
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
  [Networks.BERACHAIN]: {
    rpc_url: process.env.BERACHAIN_RPC_URLS?.split(',')[0] || 'https://bepolia.rpc.berachain.com/',
  },
  [Networks.BSC_TESTNET]: {
    rpc_url: process.env.BSC_TESTNET_RPC_URL?.split(',')[0] || 'https://bsc-testnet-dataseed.bnbchain.org',
    useOldMarketAbi: true,
  },
}