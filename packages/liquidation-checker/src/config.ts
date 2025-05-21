import { Networks } from './constants'

interface MarketNetworkConfig {
  address: string
  positions_per_run: number
}
export interface MarketConfig {
  workers: number
  cron_schedule: string
  networks: Partial<Record<Networks, MarketNetworkConfig>>
}

export interface NetworkConfig {
  rpcUrls: string[]
  multicall2_address: string
  ovl_state_address: string
  multicall_batch_size: number
  rpc_first_probability: number
}

export const networkConfig: Record<Networks, NetworkConfig> = {
  [Networks.ARBITRUM]: {
    rpcUrls: process.env.ARBITRUM_RPC_URLS?.split(',') || [
      'https://arbitrum-sepolia-rpc.publicnode.com',
    ],
    multicall2_address: '0xA115146782b7143fAdB3065D86eACB54c169d092',
    ovl_state_address: '0x2878837ea173e8bd40db7cee360b15c1c27deb5a',
    multicall_batch_size: 300,
    rpc_first_probability: 0.7,
  },
  [Networks.BERACHAIN]: {
    rpcUrls: process.env.BERACHAIN_RPC_URLS?.split(',') || ['https://bepolia.rpc.berachain.com/'],
    multicall2_address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    ovl_state_address: '0xC50C7a502e6aE874A6299f385F938aF5C30CB91d',
    multicall_batch_size: 300,
    rpc_first_probability: 1,
  },
  [Networks.BSC_TESTNET]: {
    rpcUrls: process.env.BSC_TESTNET_RPC_URLS?.split(',') || ['https://bsc-testnet-dataseed.bnbchain.org'],
    multicall2_address: '0xca11bde05977b3631167028862be2a173976ca11',
    ovl_state_address: '0x81BdBf6C69882Fe7c958018D3fF7FcAcb59EF8b7',
    multicall_batch_size: 300,
    rpc_first_probability: 1,
  },
}

export const config: Record<string, MarketConfig> = {
  'ETH Dominance': {
    workers: 1,
    cron_schedule: '0 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x3a204d03e9B1fEE01b8989333665b6c46Cc1f79E',
        positions_per_run: 5000,
      },
      [Networks.BSC_TESTNET]: {
        address: '0x39d6c6D1B3A3cafb2cFd6E753EcC54b316392aFa',
        positions_per_run: 500,
      },
    },
  },
  'BTC Dominance': {
    workers: 1,
    cron_schedule: '5 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x553de578e68a4faa55d4522665cb2d2d53390d22',
        positions_per_run: 4000,
      },
    },
  },
  'Quantum Cats': {
    workers: 1,
    cron_schedule: '10 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x4EDFB4057F3a448B2704dF1A3665Db4AE6371B69',
        positions_per_run: 1000,
      },
    },
  },
  'CS2 Skins': {
    workers: 1,
    cron_schedule: '15 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x6aa41b8f2f858723aafcf388a90d34d1cb1162d9',
        positions_per_run: 2500,
      },
      [Networks.BSC_TESTNET]: {
        address: '0xE886b759c7811052EF54CCbC7359766A134211fb',
        positions_per_run: 500,
      },
    },
  },
  'Bitcoin Frogs': {
    workers: 1,
    cron_schedule: '20 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0xC7f3240d983fcAB7A571bE484d2b4dA43B95efEe',
        positions_per_run: 1200,
      },
    },
  },
  Ink: {
    workers: 1,
    cron_schedule: '25 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0xe060ea13b2e710cefc5124bb790db4823b0f602a',
        positions_per_run: 1000,
      },
    },
  },
  NodeMonkes: {
    workers: 1,
    cron_schedule: '30 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0xef898dbf4F4D75bdfbDd85F781A6C1BF8EDaF0AE',
        positions_per_run: 1000,
      },
    },
  },
  EvIndex: {
    workers: 1,
    cron_schedule: '*/30 * * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x770E3A8afC5c01855b5bD8EB5b96b23bd7Af1e43',
        positions_per_run: 100,
      },
    },
  },
  AiIndex: {
    workers: 1,
    cron_schedule: '40 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0xad90fFf9D159e18CEc2048Dd6881e29886e4899E',
        positions_per_run: 1000,
      },
      [Networks.BSC_TESTNET]: {
        address: '0xCeC1Bdb2d5e7e6B25DCd4415b01598Db522299d7',
        positions_per_run: 500,
      },
    },
  },
  EthSol: {
    workers: 1,
    cron_schedule: '45 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x3966f792517E2Df998C48301163c2A95BFd3efF8',
        positions_per_run: 1000,
      },
    },
  },
  'CS Rifles': {
    workers: 1,
    cron_schedule: '47 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0xE35a856F1d98f101c5C60dB8d02BA4Dff87986B3',
        positions_per_run: 1000,
      },
    },
  },
  'CS Knives': {
    workers: 1,
    cron_schedule: '49 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x6Dfe4094599C74A920285A17608Ae023D707eEd9',
        positions_per_run: 1000,
      },
    },
  },
  'CS Knives Rifles': {
    workers: 1,
    cron_schedule: '51 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x2011d14B00f49CC461958Be682bC1443C7Fd5d87',
        positions_per_run: 1000,
      },
    },
  },
  'Cats Dogs 2': {
    workers: 1,
    cron_schedule: '53 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x73973d72eef84a8624e4ec381e8e73caff570092',
        positions_per_run: 1000,
      },
    },
  },
  'Cats Frogs': {
    workers: 1,
    cron_schedule: '53 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x8bfb2494f3a9b1441185cf04bb10e92e6b4fd9b9',
        positions_per_run: 1000,
      },
    },
  },
  'Frogs Dogs': {
    workers: 1,
    cron_schedule: '53 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0xecd76abb33c36dd62a7d033d26f7146801e03d4f',
        positions_per_run: 1000,
      },
    },
  },
  'Real Estate': {
    workers: 1,
    cron_schedule: '13 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x31d1e411db1a11a5741ff55d5c01c0c4cf4ac891',
        positions_per_run: 1000,
      },
    },
  },
  'Super Eth': {
    workers: 1,
    cron_schedule: '15 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0xfD3362Feb6a1fd9C7fDD4e314ecdaAC1E54360C6',
        positions_per_run: 1000,
      },
    },
  },
  'Carlsen': {
    workers: 1,
    cron_schedule: '17 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0xF3A513ADaDb8F1617c71B7B48Bc0Ef0CF9509E0F',
        positions_per_run: 1000,
      },
      [Networks.BSC_TESTNET]: {
        address: '0xCb351B69686573Ce6657c6711ef86585EAaf212a',
        positions_per_run: 500,
      },
    },
  },
  'Hikaru': {
    workers: 1,
    cron_schedule: '19 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x3BAD2B943f4921C90f8738791A842905376FFb1d',
        positions_per_run: 1000,
      },
      [Networks.BSC_TESTNET]: {
        address: '0x461e07C991Aaef9007577cE280cd466a385b16b2',
        positions_per_run: 500,
      },
    },
  },
  'Spotify Lana Del Rey': {
    workers: 1,
    cron_schedule: '21 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x8dDcf6C9c8b076F79be582544877087c3caBb9Eb',
        positions_per_run: 1000,
      },
      [Networks.BSC_TESTNET]: {
        address: '0x64e5b483c669E5eD772928B66DEd4b4a27c6e563',
        positions_per_run: 500,
      },
    },
  },
  'Bera NFTs Index': {
    workers: 1,
    cron_schedule: '23 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x8dDcf6C9c8b076F79be582544877087c3caBb9Eb',
        positions_per_run: 1000,
      },
    },
  },
  'AI Agents Index': {
    workers: 1,
    cron_schedule: '25 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0xa7323c2E3EF542760ec727F4069d76d1aA4Cb207',
        positions_per_run: 1000,
      },
      [Networks.BSC_TESTNET]: {
        address: '0x757c732844ef5953b163fa2fd4f7dc0093ed3f44',
        positions_per_run: 500,
      },
    },
  },
  'Defi Index': {
    workers: 1,
    cron_schedule: '27 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x4878328c8bc1a573f4ee6078a8f7f4cab9389e4b',
        positions_per_run: 1000,
      },
      [Networks.BSC_TESTNET]: {
        address: '0x973dd431ef5e057Ef69cC23a7FBA9183c6a3BEc9',
        positions_per_run: 500,
      },
    },
  },
  'Layer 1 Index': {
    workers: 1,
    cron_schedule: '29 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x5a38a6396b370b6d9eaa57a02c2ae8505f5b7565',
        positions_per_run: 1000,
      },
      [Networks.BSC_TESTNET]: {
        address: '0x4D3AEB975d0178AcF62cBB0D11B8Ac30671ac003',
        positions_per_run: 500,
      },
    },
  },
  'Layer 2 Index': {
    workers: 1,
    cron_schedule: '31 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x1c4e3bdfc14b5a0e00a1b1b85649d15eee45c965',
        positions_per_run: 1000,
      },
      [Networks.BSC_TESTNET]: {
        address: '0xB4f72FFD54b7090B6da8eAD9Dd689B5ba93cCdF5',
        positions_per_run: 500,
      },
    },
  },
  'Layer1 Vs Layer2 Index': {
    workers: 1,
    cron_schedule: '33 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x0bbeddf276286d56a3bcef6758f88899186cebaf',
        positions_per_run: 1000,
      },
      [Networks.BSC_TESTNET]: {
        address: '0x64E6416d5eF820f23E09C53ADF6aC4ab061a305D',
        positions_per_run: 500,
      },
    },
  },
  'HoneyComb and Jars NFT Index': {
    workers: 1,
    cron_schedule: '35 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0xf1a44a7d3da0dbb9b01b46bd4d0e69b285ff86eb',
        positions_per_run: 1000,
      },
    },
  },
  'iBGT BERA': {
    workers: 1,
    cron_schedule: '37 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x3df3d22b997b052fed9d5b7852a69857a18b2f35',
        positions_per_run: 1000,
      },
    },
  },
  'Bullas': {
    workers: 1,
    cron_schedule: '39 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x035138efbce8bceea1d02a29ed34b66d48b28c2d',
        positions_per_run: 1000,
      },
    },
  },
  'Amouranth vs peachJars': {
    workers: 1,
    cron_schedule: '35 */2 * * * *',
    networks: {
      [Networks.BSC_TESTNET]: {
        address: '0x90463EEF2db8d2a5B4d42Bfa29266658bA146668',
        positions_per_run: 500,
      },
    },
  },
  'Jessicanigri vs Monalita': {
    workers: 1,
    cron_schedule: '37 */2 * * * *',
    networks: {
      [Networks.BSC_TESTNET]: {
        address: '0x009966e81Bc03D412052e75f3B281754e0f4C7B9',
        positions_per_run: 500,
      },
    },
  },
  'Monalita vs Elvasnaps': {
    workers: 1,
    cron_schedule: '39 */2 * * * *',
    networks: {
      [Networks.BSC_TESTNET]: {
        address: '0x679151e1c29D1A848F6Ddc2B64fC4B81724C196A',
        positions_per_run: 500,
      },
    },
  },
  'Binance Alpha Index': {
    workers: 1,
    cron_schedule: '41 */2 * * * *',
    networks: {
      [Networks.BSC_TESTNET]: {
        address: '0x7Ee577Fb630e9Edd2f5c62e857353545dF53A66B',
        positions_per_run: 500,
      },
    },
  },
  'BNB / USD': {
    workers: 1,
    cron_schedule: '43 */2 * * * *',
    networks: {
      [Networks.BSC_TESTNET]: {
        address: '0xD9D2948f867Cf04e06Db278aAD2Dd0fE75fbE9f2',
        positions_per_run: 500,
      },
    },
  },
  'Made In USA Index': {
    workers: 1,
    cron_schedule: '45 */2 * * * *',
    networks: {
      [Networks.BSC_TESTNET]: {
        address: '0x3d084117FD13773dc4745D268717e4B4C51972D6',
        positions_per_run: 500,
      },
    },
  },
  'SOL Index': {
    workers: 1,
    cron_schedule: '47 */2 * * * *',
    networks: {
      [Networks.BSC_TESTNET]: {
        address: '0x5A42905192d4a2d27f0664E912b7f3FfD8254591',
        positions_per_run: 500,
      },
    },
  },
  'SOL/USD': { 
    workers: 1,
    cron_schedule: '49 */2 * * * *',
    networks: {
      [Networks.BSC_TESTNET]: {
        address: '0xe979178e6c15550D36215e273df3AAE010043714',
        positions_per_run: 500,
      },
    },
  },
}