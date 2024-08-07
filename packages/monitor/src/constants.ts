export const markets: { [key: string]: string } = {
  '0x3a204d03e9B1fEE01b8989333665b6c46Cc1f79E': 'ETH Dominance',
  '0x553de578e68a4faa55d4522665cb2d2d53390d22': 'BTC Dominance',
  '0x4EDFB4057F3a448B2704dF1A3665Db4AE6371B69': 'Quantum Cats',
  '0x6aa41b8f2f858723aafcf388a90d34d1cb1162d9': 'CS2 Skins',
  '0xC7f3240d983fcAB7A571bE484d2b4dA43B95efEe': 'Bitcoin Frogs',
  '0xe060ea13b2e710cefc5124bb790db4823b0f602a': 'Ink',
  '0xef898dbf4F4D75bdfbDd85F781A6C1BF8EDaF0AE': 'NodeMonkes',
  '0x770E3A8afC5c01855b5bD8EB5b96b23bd7Af1e43': 'EvIndex',
  '0xad90fFf9D159e18CEc2048Dd6881e29886e4899E': 'AiIndex',
}

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
