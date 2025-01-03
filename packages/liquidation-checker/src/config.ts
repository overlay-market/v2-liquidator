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
    rpcUrls: process.env.BERACHAIN_RPC_URLS?.split(',') || ['https://bartio.rpc.berachain.com/'],
    multicall2_address: '0xDe9D8f9d9d2B276Dd5B921211AcB918d33Ed0B6C',
    ovl_state_address: '0x4f69Dfb24958fCf69b70BcA73c3E74F2c82BB405',
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
      [Networks.BERACHAIN]: {
        address: '0x09E8641df1E963d0bB1267e51579fC2B4E3E60cd',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0xd9b217fa8A9E8Ef1c8558128029564e9A50F284D',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0xB2599445Aeb2fa97d5d8D02E70FFb938F3D803Ee',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0x49c4ad8B75e118a9b7Bd1b89E7AF029f3cB1c237',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0x3178aa08845c986CC62d8aAAAc0ec1FB381d01b3',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0x67D54a54d07600eA7AC68A3d5C8B5F5c28510F7d',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0x3D47247220D89AD623767De2045Dc5e0c5920610',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0x1C66ae94C7dD18935F1E723d6395dAC27905Ab0c',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0x9d32d77C2213A5FF7b6E52669D32752CC092Ff40',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0x745D36559834f6b016fc43d2261F0709e62344e1',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0x789d85Fb4F104fEb1cd85C7475C02F3F8e2dFf5B',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0x9eb938C3739bBf2B54A80AdD213F66fe4Cd694DC',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0xa85ad94c84f2bdc48127d93d087054a5f7e5726b',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0xf0d9f85295d7a41b51aa5bde08c199735fa15909',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0x0befa5099b225ffdaadbba5911d464e12a75a773',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0xd27803e696f818038c19f10ca8fc509ec07ba04c',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0x7883c07F0b6D8004e2c8348Ab5dF2113423A5629',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0xFcf1CD40d20ae4955b35833c2329E923A5D8453d',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0xDD81f146822100a71D1485a087a0F5D571b66942',
        positions_per_run: 50,
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
      [Networks.BERACHAIN]: {
        address: '0x3a7302C4844853F7A7C14f8E671F190244A69B4C',
        positions_per_run: 50,
      },
    },
  },
}