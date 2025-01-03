import dotenv from 'dotenv'

dotenv.config()

export interface Market {
  address: string;
  init_block: string;
}

export enum Networks {
  ARBITRUM = "arbitrum",
  BERACHAIN = "berachain",
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
  [Networks.ARBITRUM]: {
    rpc_url: process.env.ARBITRUM_RPC_URLS?.split(',')[0] || 'https://arbitrum-sepolia-rpc.publicnode.com',
    fork_rpc_url: process.env.ARBITRUM_FORK_RPC_URL?.split(',')[0] || 'https://arbitrum-sepolia-rpc.publicnode.com',
    markets: {
      'ETH Dominance': {
        address: '0x3a204d03e9B1fEE01b8989333665b6c46Cc1f79E',
        init_block: '12600256',
      },
      'BTC Dominance': {
        address: '0x553de578e68a4faa55d4522665cb2d2d53390d22',
        init_block: '2163024',
      },
      'Quantum Cats': {
        address: '0x4EDFB4057F3a448B2704dF1A3665Db4AE6371B69',
        init_block: '16499215',
      },
      'CS2 Skins': {
        address: '0x6aa41b8f2f858723aafcf388a90d34d1cb1162d9',
        init_block: '1590839',
      },
      'Bitcoin Frogs': {
        address: '0xC7f3240d983fcAB7A571bE484d2b4dA43B95efEe',
        init_block: '16498932',
      },
      'Ink': {
        address: '0xe060ea13b2e710cefc5124bb790db4823b0f602a',
        init_block: '29178446',
      },
      'NodeMonkes': {
        address: '0xef898dbf4F4D75bdfbDd85F781A6C1BF8EDaF0AE',
        init_block: '16499121',
      },
      'EvIndex': {
        address: '0x770E3A8afC5c01855b5bD8EB5b96b23bd7Af1e43',
        init_block: '48459493',
      },
      'AiIndex': {
        address: '0xad90fFf9D159e18CEc2048Dd6881e29886e4899E',
        init_block: '54018512',
      },
      'EthSol': {
        address: '0x3966f792517E2Df998C48301163c2A95BFd3efF8',
        init_block: '58877180',
      },
      'CS Rifles': {
        address: '0xE35a856F1d98f101c5C60dB8d02BA4Dff87986B3',
        init_block: '77553289',
      },
      'CS Knives': {
        address: '0x6Dfe4094599C74A920285A17608Ae023D707eEd9',
        init_block: '77553504',
      },
      'CS Knives Rifles': {
        address: '0x2011d14B00f49CC461958Be682bC1443C7Fd5d87',
        init_block: '77553837',
      },
      'Cats Dogs 2': {
        address: '0x73973d72eef84a8624e4ec381e8e73caff570092',
        init_block: '83398517',
      },
      'Cats Frogs': {
        address: '0x8bfb2494f3a9b1441185cf04bb10e92e6b4fd9b9',
        init_block: '83398664',
      },
      'Frogs Dogs': {
        address: '0xecd76abb33c36dd62a7d033d26f7146801e03d4f',
        init_block: '83398824',
      },
      'Real Estate': {
        address: '0x31d1e411db1a11a5741ff55d5c01c0c4cf4ac891',
        init_block: '86272345',
      },
      'Super Eth': {
        address: '0xfD3362Feb6a1fd9C7fDD4e314ecdaAC1E54360C6',
        init_block: '87446746',
      },
      'Carlsen': {
        address: '0xF3A513ADaDb8F1617c71B7B48Bc0Ef0CF9509E0F',
        init_block: '89445675',
      },
      'Hikaru': {
        address: '0x3BAD2B943f4921C90f8738791A842905376FFb1d',
        init_block: '89640248',
      },
      'Spotify Lana Del Rey': {
        address: '0x8dDcf6C9c8b076F79be582544877087c3caBb9Eb',
        init_block: '110298214',
      },
    },
    enabled: true,
    blockStep: 45000,
    useFork: true,
    useOldMarketAbi: true,
  },
  [Networks.BERACHAIN]: {
    rpc_url: process.env.BERACHAIN_RPC_URLS?.split(',')[0] || 'https://bartio.rpc.berachain.com/',
    fork_rpc_url: process.env.BERACHAIN_FORK_RPC_URL?.split(',')[0] || 'https://bartio.rpc.berachain.com/',
    markets: {
      'BTC Dominance': {
        address: '0xd9b217fa8A9E8Ef1c8558128029564e9A50F284D',
        init_block: '2643774',
      },
      'ETH Dominance': {
        address: '0x09E8641df1E963d0bB1267e51579fC2B4E3E60cd',
        init_block: '2979993',
      },
      'Quantum Cats': {
        address: '0xB2599445Aeb2fa97d5d8D02E70FFb938F3D803Ee',
        init_block: '2980020',
      },
      'CS2 Skins': {
        address: '0x49c4ad8B75e118a9b7Bd1b89E7AF029f3cB1c237',
        init_block: '2987238',
      },
      'Bitcoin Frogs': {
        address: '0x3178aa08845c986CC62d8aAAAc0ec1FB381d01b3',
        init_block: '2980047',
      },
      'Ink': {
        address: '0x67D54a54d07600eA7AC68A3d5C8B5F5c28510F7d',
        init_block: '2980066',
      },
      'NodeMonkes': {
        address: '0x3D47247220D89AD623767De2045Dc5e0c5920610',
        init_block: '2980095',
      },
      'AiIndex': {
        address: '0x1C66ae94C7dD18935F1E723d6395dAC27905Ab0c',
        init_block: '2979948',
      },
      'EthSol': {
        address: '0x9d32d77C2213A5FF7b6E52669D32752CC092Ff40',
        init_block: '2980119',
      },
      'CS Rifles': {
        address: '0x745D36559834f6b016fc43d2261F0709e62344e1',
        init_block: '3518395',
      },
      'CS Knives': {
        address: '0x789d85Fb4F104fEb1cd85C7475C02F3F8e2dFf5B',
        init_block: '3824316',
      },
      'CS Knives Rifles': {
        address: '0x9eb938C3739bBf2B54A80AdD213F66fe4Cd694DC',
        init_block: '3824328',
      },
      'Cats Dogs 2': {
        address: '0xa85ad94c84f2bdc48127d93d087054a5f7e5726b',
        init_block: '4678879',
      },
      'Cats Frogs': {
        address: '0xf0d9f85295d7a41b51aa5bde08c199735fa15909',
        init_block: '4678895',
      },
      'Frogs Dogs': {
        address: '0x0befa5099b225ffdaadbba5911d464e12a75a773',
        init_block: '4678914',
      },
      'Real Estate': {
        address: '0xd27803e696f818038c19f10ca8fc509ec07ba04c',
        init_block: '5189892',
      },
      'Super Eth': {
        address: '0x7883c07F0b6D8004e2c8348Ab5dF2113423A5629',
        init_block: '5399003',
      },
      'Carlsen': {
        address: '0xFcf1CD40d20ae4955b35833c2329E923A5D8453d',
        init_block: '5696408',
      },
      'Hikaru': {
        address: '0xDD81f146822100a71D1485a087a0F5D571b66942',
        init_block: '5733190',
      },
      'Spotify Lana Del Rey': {
        address: '0x3a7302C4844853F7A7C14f8E671F190244A69B4C',
        init_block: '8489075',
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