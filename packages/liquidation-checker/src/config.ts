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
    ovl_state_address: '0xDD711dA03Ef569dfE8dd466845e36d9Fc91E1e45',
    multicall_batch_size: 300,
    rpc_first_probability: 1,
  },
  [Networks.MOVEMENT]: {
    rpcUrls: process.env.MOVEMENT_RPC_URLS?.split(',') || [
      'https://mevm.devnet.imola.movementlabs.xyz',
    ],
    multicall2_address: '0xc5F85207a16FB6634eAd4f17Ad5222F122e8F0De',
    ovl_state_address: '0x0CA6128B528f503C7c649ba9cc02560a8B9fD55e',
    multicall_batch_size: 10,
    rpc_first_probability: 1,
  },
}

export const config: Record<string, MarketConfig> = {
  'ETH Dominance': {
    workers: 1,
    cron_schedule: '0 */2 * * * *',
    networks: {
      // [Networks.ARBITRUM]: {
      //   address: '0x3a204d03e9B1fEE01b8989333665b6c46Cc1f79E',
      //   positions_per_run: 5000,
      // },
      [Networks.MOVEMENT]: {
        address: '0xB021EB4489c230234567Ca6789e53403310Db090',
        positions_per_run: 500,
      }
    },
  },
  'BTC Dominance': {
    workers: 1,
    cron_schedule: '5 */2 * * * *',
    networks: {
      // [Networks.ARBITRUM]: {
      //   address: '0x553de578e68a4faa55d4522665cb2d2d53390d22',
      //   positions_per_run: 4000,
      // },
      [Networks.MOVEMENT]: {
        address: '0xeab2fbdc9d43e785eb4065c8447d872735729aac',
        positions_per_run: 500,
      },
      // [Networks.BERACHAIN]: {
      //   address: '0xd9b217fa8a9e8ef1c8558128029564e9a50f284d',
      //   positions_per_run: 50,
      // },
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
    cron_schedule: '35 */2 * * * *',
    networks: {
      [Networks.ARBITRUM]: {
        address: '0x770E3A8afC5c01855b5bD8EB5b96b23bd7Af1e43',
        positions_per_run: 1000,
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
}