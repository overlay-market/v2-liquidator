export const rpcURL = 'https://arbitrum-sepolia-rpc.publicnode.com'

export const OVTokenAddress = '0x3E27fAe625f25291bFda517f74bf41DC40721dA2'

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
