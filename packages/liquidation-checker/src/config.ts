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
    },
  },
}