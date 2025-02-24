import dotenv from 'dotenv'

dotenv.config()

export interface Position {
  positionId: string
  owner: string
  marketAddress: string
  network: Networks
}

export enum Networks {
  BERACHAIN = "berachain",
}

export interface NetworksConfig {
  rpc_url: string;
}

export const networksConfig: Record<Networks, NetworksConfig> = {
  [Networks.BERACHAIN]: {
    rpc_url: process.env.BERACHAIN_RPC_URLS?.split(',')[0] || 'https://bartio.rpc.berachain.com/',
  },
}