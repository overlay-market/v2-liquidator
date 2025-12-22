import { Networks } from './constants'

interface MarketNetworkConfig {
  address: string
  positions_per_run: number
  factory_address: string
}
export interface MarketConfig {
  workers: number
  cron_schedule: string
  networks: Partial<Record<Networks, MarketNetworkConfig>>
}

export interface FactoryConfig {
  ovl_state_address: string
  name: string
}

export interface NetworkConfig {
  rpcUrls: string[]
  multicall2_address: string
  factories: Record<string, FactoryConfig>
  multicall_batch_size: number
  rpc_first_probability: number
}

export const networkConfig: Record<Networks, NetworkConfig> = {
  [Networks.BSC_MAINNET]: {
    rpcUrls: process.env.BSC_MAINNET_RPC_URLS?.split(',') || ['https://bsc-rpc.publicnode.com'],
    multicall2_address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    factories: {
      '0xC35093f76fF3D31Af27A893CDcec585F1899eE54': {
        ovl_state_address: '0x10575a9C8F36F9F42D7DB71Ef179eD9BEf8Df238',
        name: 'Original',
      },
      '0x17D4F2ea0c3227FB6b31ADA99265E41f3369150A': {
        ovl_state_address: '0x9C52f7107efBe6e0010E924a0B53265ba4e8959d',
        name: 'Gambling',
      },
      '0x5e6613da86099c264ef9cd56c142506bbf642825': {
        ovl_state_address: '0x6fecbf42b2dcf4bfd3c1c60dcd956247f4abd35e',
        name: 'Gambling',
      },
    },
    multicall_batch_size: 300,
    rpc_first_probability: 1,
  },
}

export const config: Record<string, MarketConfig> = {
  'CS2 Skins': {
    workers: 1,
    cron_schedule: '15 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x5Ec437121a47B86B40FdF1aB4eF95806e60a9247',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'Spotify The Weeknd': {
    workers: 1,
    cron_schedule: '17 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x809E3b60cFb68d617e75ccCc8B15336dB7bAEB06',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'Strategic Reserve Index': {
    workers: 1,
    cron_schedule: '19 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x3fd2f14ae16919FDC7B1c3beF0cDbaA6A6B427Dc',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'BNB/USD': {
    workers: 1,
    cron_schedule: '21 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x6bfde86c4C5AABb614addB51bDAd1C4450bD2901',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'Binance Alpha Index': {
    workers: 1,
    cron_schedule: '23 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x799B52DF5394b143C7786b1E6E4533CE1De5D817',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'AI Index': {
    workers: 1,
    cron_schedule: '25 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xb9FB39bD8C24bd4E8eDF339a33fb5cD2eD2dd9C8',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'USA Index': {
    workers: 1,
    cron_schedule: '27 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x5B6a02E0Bd8Ed1D6d58368D60275F60D26e0FB55',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'BTC Dominance': {
    workers: 1,
    cron_schedule: '29 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x204b281d5f5a504043Ae2D91f3CF79bbBC1F6E09',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'BTC/USD': {
    workers: 1,
    cron_schedule: '31 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x3d9701e8fE563D82c3787b3a783d8a218591E4A3',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'ETH/USD': {
    workers: 1,
    cron_schedule: '33 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x6aB3469c76ADf1eEF65EE105dac1093c130468BA',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'SOL/USD': {
    workers: 1,
    cron_schedule: '35 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x23cEfE1C6ea3c067F9500c8D9961baf01C39Ce3E',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'Aster/MYX': {
    workers: 1,
    cron_schedule: '37 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x377d6e6647189aa7ea9a5e12f4bdc7ecaebb7d45',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'MrBeast': {
    workers: 1,
    cron_schedule: '39 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x02e9bbcf589ffcbdcc7f26064bf718611523a2bf',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'gold-usd': {
    workers: 1,
    cron_schedule: '41 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x6c110d58dee4f0229c305c4858ab50fd203b8da5',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'GOLD/USD v2': {
    workers: 1,
    cron_schedule: '45 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x2be9Fcd44635ae5d2c0BD39ae1FB5615D9e5299d',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'BTC/USD v2': {
    workers: 1,
    cron_schedule: '47 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xf70770051f8C02F8a96D2D01F1C521555bb15203',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'ETH/USD v2': {
    workers: 1,
    cron_schedule: '49 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xD214F7D05406Fc28557625AA0C0da71458E0CC6C',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'SOL/USD v2': {
    workers: 1,
    cron_schedule: '53 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xFf0bEFd39b7EA4B4B069658f6585F8eF0287fAD8',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'BNB/USD v2': {
    workers: 1,
    cron_schedule: '59 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xe2cd4672D085D2Ab163E248ac9293a16acCb7B67',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'BTC Dominance v2': {
    workers: 1,
    cron_schedule: '7 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xb574757A7865249E04872ad6A081ddDDEA79b9b2',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'The Weeknd v2': {
    workers: 1,
    cron_schedule: '9 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xaf489d2d691475e54AB2945eBC3243a8E9C82Ce3',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'USA Index v2': {
    workers: 1,
    cron_schedule: '11 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x446D0dCf7Aa2e05b7e955237beB03c19Cfce48e3',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'Binance Alpha Index v2': {
    workers: 1,
    cron_schedule: '13 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x90C00f8E627644B6b4ccaE4019eFcdC9D531E2AA',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'Strategic Reserve Index v2': {
    workers: 1,
    cron_schedule: '15 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x83FaE17E4d6199838791B3707ab3c080aF83FF99',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'AI Index v2': {
    workers: 1,
    cron_schedule: '17 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xe2584D1a23cb44fc7929e1723A8079dcd86B6971',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'Double or Nothing': {
    workers: 1,
    cron_schedule: '19 * * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xfFaDA7c70c2868FD0Fe9BE85D326317923BaA0a8',
        positions_per_run: 500,
        factory_address: '0x17D4F2ea0c3227FB6b31ADA99265E41f3369150A',
      },
    },
  },
  'Hikaru Nakamura': {
    workers: 1,
    cron_schedule: '21 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xfc1d83139aa4737a76e017596afa7c51f80470d0',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'Jissican vs Monalita': {
    workers: 1,
    cron_schedule: '23 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x84051e966ac782e794786333f0cd5d4584cf0ee2',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'SOL Index': {
    workers: 1,
    cron_schedule: '25 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x6832fc384c891f0c18d770aa20cb4140e836be2a',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'AI Agents Index': {
    workers: 1,
    cron_schedule: '27 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xfbefe7796b8fea946197e7ca5bffdd45270446f2',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'Defi Index': {
    workers: 1,
    cron_schedule: '29 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xc9f27accc1971c9583dd7d3e9c240555095f98e3',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'Memes Index': {
    workers: 1,
    cron_schedule: '31 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xe2c1220cac67dd50ccf917edbdfea34ad23a0371',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'Layer 1 Index': {
    workers: 1,
    cron_schedule: '33 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0x21406642d69ee3bf6ffc6795a0fa3c70c28132c7',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },
  'Layer 2 Index': {
    workers: 1,
    cron_schedule: '35 */2 * * * *',
    networks: {
      [Networks.BSC_MAINNET]: {
        address: '0xe906e2047d7fb07a9828b2342d64957407ac55e2',
        positions_per_run: 500,
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
    },
  },

}
