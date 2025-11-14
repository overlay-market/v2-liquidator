import dotenv from 'dotenv'

dotenv.config()

export interface Market {
  address: string;
  init_block: string;
  factory_address?: string;
}

export enum Networks {
  BSC_MAINNET = "bsc_mainnet",
}

export interface NetworksConfig {
  rpc_url: string;
  fork_rpc_url: string;
  markets: Record<string, Market>;
  enabled: boolean;
  blockStep: number; // for big networks 45000 is a good value; for small networks 10000
  useFork: boolean;
  useOldMarketAbi?: boolean;
}

export const networksConfig: Record<Networks, NetworksConfig> = {
  [Networks.BSC_MAINNET]: {
    rpc_url: process.env.BSC_MAINNET_RPC_URLS?.split(',')[0] || 'https://bsc-rpc.publicnode.com',
    fork_rpc_url: process.env.BSC_MAINNET_FORK_RPC_URLS?.split(',')[0] || 'https://bsc-rpc.publicnode.com',
    markets: {
      'CS2 Skins': {
        address: '0x5Ec437121a47B86B40FdF1aB4eF95806e60a9247',
        init_block: '56097602',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'Spotify The Weeknd': {
        address: '0x809E3b60cFb68d617e75ccCc8B15336dB7bAEB06',
        init_block: '57245536',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'Strategic Reserve Index': {
        address: '0x3fd2f14ae16919FDC7B1c3beF0cDbaA6A6B427Dc',
        init_block: '57245536',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'BNB/USD': {
        address: '0x6bfde86c4C5AABb614addB51bDAd1C4450bD2901',
        init_block: '57245536',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'Binance Alpha Index': {
        address: '0x799B52DF5394b143C7786b1E6E4533CE1De5D817',
        init_block: '57372370',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'AI Index': {
        address: '0xb9FB39bD8C24bd4E8eDF339a33fb5cD2eD2dd9C8',
        init_block: '58502607',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'USA Index': {
        address: '0x5B6a02E0Bd8Ed1D6d58368D60275F60D26e0FB55',
        init_block: '58942999',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'BTC Dominance': {
        address: '0x204b281d5f5a504043Ae2D91f3CF79bbBC1F6E09',
        init_block: '58942999',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'BTC/USD': {
        address: '0x3d9701e8fE563D82c3787b3a783d8a218591E4A3',
        init_block: '59986521',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'ETH/USD': {
        address: '0x6aB3469c76ADf1eEF65EE105dac1093c130468BA',
        init_block: '59986521',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'SOL/USD': {
        address: '0x23cEfE1C6ea3c067F9500c8D9961baf01C39Ce3E',
        init_block: '59986521',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'Aster/MYX': {
        address: '0x377d6e6647189aa7ea9a5e12f4bdc7ecaebb7d45',
        init_block: '62329518',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'MrBeast': {
        address: '0x02e9bbcf589ffcbdcc7f26064bf718611523a2bf',
        init_block: '63690500',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'gold-usd': {
        address: '0x6c110d58dee4f0229c305c4858ab50fd203b8da5',
        init_block: '64052213',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'GOLD/USD v2': {
        address: '0x2be9Fcd44635ae5d2c0BD39ae1FB5615D9e5299d',
        init_block: '65628846',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'BTC/USD v2': {
        address: '0xf70770051f8C02F8a96D2D01F1C521555bb15203',
        init_block: '65628846',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'ETH/USD v2': {
        address: '0xD214F7D05406Fc28557625AA0C0da71458E0CC6C',
        init_block: '65628846',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'SOL/USD v2': {
        address: '0xFf0bEFd39b7EA4B4B069658f6585F8eF0287fAD8',
        init_block: '65628846',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'BNB/USD v2': {
        address: '0xe2cd4672D085D2Ab163E248ac9293a16acCb7B67',
        init_block: '65628846',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'BTC Dominance v2': {
        address: '0xb574757A7865249E04872ad6A081ddDDEA79b9b2',
        init_block: '65628846',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'The Weeknd v2': {
        address: '0xaf489d2d691475e54AB2945eBC3243a8E9C82Ce3',
        init_block: '65628846',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'USA Index v2': {
        address: '0x446D0dCf7Aa2e05b7e955237beB03c19Cfce48e3',
        init_block: '65628846',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'Binance Alpha Index v2': {
        address: '0x90C00f8E627644B6b4ccaE4019eFcdC9D531E2AA',
        init_block: '65628846',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'Strategic Reserve Index v2': {
        address: '0x83FaE17E4d6199838791B3707ab3c080aF83FF99',
        init_block: '65628846',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'AI Index v2': {
        address: '0xe2584D1a23cb44fc7929e1723A8079dcd86B6971',
        init_block: '65628846',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'Double or Nothing': {
        address: '0xfFaDA7c70c2868FD0Fe9BE85D326317923BaA0a8',
        init_block: '66549902',
        factory_address: '0x17D4F2ea0c3227FB6b31ADA99265E41f3369150A',
      },
      'Hikaru Nakamura': {
        address: '0xfc1d83139aa4737a76e017596afa7c51f80470d0',
        init_block: '67122704',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'Jissican vs Monalita': {
        address: '0x84051e966ac782e794786333f0cd5d4584cf0ee2',
        init_block: '67122704',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'SOL Index': {
        address: '0x6832fc384c891f0c18d770aa20cb4140e836be2a',
        init_block: '67841194',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'AI Agents Index': {
        address: '0xfbefe7796b8fea946197e7ca5bffdd45270446f2',
        init_block: '67841259',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'Defi Index': {
        address: '0xc9f27accc1971c9583dd7d3e9c240555095f98e3',
        init_block: '68172540',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'Memes Index': {
        address: '0xe2c1220cac67dd50ccf917edbdfea34ad23a0371',
        init_block: '68172540',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'Layer 1 Index': {
        address: '0x21406642d69ee3bf6ffc6795a0fa3c70c28132c7',
        init_block: '68172540',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },
      'Layer 2 Index': {
        address: '0xe906e2047d7fb07a9828b2342d64957407ac55e2',
        init_block: '68172540',
        factory_address: '0xC35093f76fF3D31Af27A893CDcec585F1899eE54',
      },

    },
    enabled: true,
    blockStep: 5000,
    useFork: false,
  },
}

export enum EventType {
  Build = 'Build',
  Unwind = 'Unwind',
  Liquidate = 'Liquidate',
  CacheRiskCalc = 'CacheRiskCalc',
  EmergencyWithdraw = 'EmergencyWithdraw',
  Paused = 'Paused',
  Unpaused = 'Unpaused',
  Update = 'Update',
}

export enum PositionStatus {
  New = 'New',
  Updated = 'Updated',
  Removed = 'Removed',
  OtherEvent = 'OtherEvent',
  Error = 'Error',
}
