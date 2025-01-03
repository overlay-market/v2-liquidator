export enum Networks {
  ARBITRUM = "arbitrum",
  BERACHAIN = "berachain",
}

interface NetworkConfig {
  rpcUrl: string
  apiUrl: string
  ov_token_address: string
}

export const networkConfig: Record<Networks, NetworkConfig> = {
  [Networks.ARBITRUM]: {
    rpcUrl: 'https://arbitrum-sepolia-rpc.publicnode.com',
    apiUrl: 'https://api.overlay.market/sepolia-charts/v1/charts/markets',
    ov_token_address: '0x3E27fAe625f25291bFda517f74bf41DC40721dA2',
  },
  [Networks.BERACHAIN]: {
    rpcUrl: 'https://bartio.rpc.berachain.com/',
    apiUrl: 'https://api.overlay.market/bartio-charts/v1/charts/markets',
    ov_token_address: '0x97576e088f0d05EF68cac2EEc63d017FE90952a0',
  },
}

export const erc20ABI = [
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]
