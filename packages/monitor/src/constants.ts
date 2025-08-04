export enum Networks {
  ARBITRUM = "arbitrum",
  BERACHAIN = "berachain",
  BSC_TESTNET = "bsc_testnet",
  BSC_MAINNET = "bsc_mainnet",
}

export const ChainId = {
  [Networks.ARBITRUM]: 421614,
  [Networks.BERACHAIN]: 80069,
  [Networks.BSC_TESTNET]: 97,
  [Networks.BSC_MAINNET]: 56,
}

interface NetworkConfig {
  rpcUrl: string
  apiUrl: string
  ov_token_address: string
}

export const networkConfig: Record<Networks, NetworkConfig> = {
  [Networks.ARBITRUM]: {
    rpcUrl: 'https://arbitrum-sepolia-rpc.publicnode.com',
    apiUrl: 'https://api.overlay.market/data/api/markets',
    ov_token_address: '0x3E27fAe625f25291bFda517f74bf41DC40721dA2',
  },
  [Networks.BERACHAIN]: {
    rpcUrl: 'https://bepolia.rpc.berachain.com/',
    apiUrl: 'https://api.overlay.market/data/api/markets',
    ov_token_address: '0xd37f15e6f2E5F4A624bbb9864f56bbd2e9b201b5',
  },
  [Networks.BSC_TESTNET]: {
    rpcUrl: 'https://bsc-testnet-dataseed.bnbchain.org',
    apiUrl: 'https://api.overlay.market/data/api/markets',
    ov_token_address: '0xb880E767739A82Eb716780BDfdbC1eD7b23BDB38',
  },
  [Networks.BSC_MAINNET]: {
    rpcUrl: 'https://bsc-dataseed.bnbchain.org',
    apiUrl: 'https://api.overlay.market/data/api/markets',
    ov_token_address: '0x1F34c87ded863Fe3A3Cd76FAc8adA9608137C8c3',
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
