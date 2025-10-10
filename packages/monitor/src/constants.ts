export enum Networks {
  BSC_TESTNET = "bsc_testnet",
}

export const ChainId = {
  [Networks.BSC_TESTNET]: 97,
}

interface NetworkConfig {
  rpcUrl: string
  apiUrl: string
  ov_token_address: string
}

export const networkConfig: Record<Networks, NetworkConfig> = {
  [Networks.BSC_TESTNET]: {
    rpcUrl: 'https://bsc-testnet-rpc.publicnode.com',
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
