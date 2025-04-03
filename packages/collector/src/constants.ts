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
      'Bera NFTs Index': {
        address: '0x32A7489c9FC9dbD554afA0498C979370C0200caC',
        init_block: '114602081',
      },
      'AI Agents Index': {
        address: '0xa7323c2E3EF542760ec727F4069d76d1aA4Cb207',
        init_block: '116321816',
      },
      'Defi Index': {
        address: '0x4878328c8bc1a573f4ee6078a8f7f4cab9389e4b',
        init_block: '123498197',
      },
      'Layer 1 Index': {
        address: '0x5a38a6396b370b6d9eaa57a02c2ae8505f5b7565',
        init_block: '123498477',
      },
      'Layer 2 Index': {
        address: '0x1c4e3bdfc14b5a0e00a1b1b85649d15eee45c965',
        init_block: '123498749',
      },
      'Layer1 Vs Layer2 Index': {
        address: '0x0bbeddf276286d56a3bcef6758f88899186cebaf',
        init_block: '123499419',
      },
      'HoneyComb and Jars NFT Index': {
        address: '0xf1a44a7d3da0dbb9b01b46bd4d0e69b285ff86eb',
        init_block: '123499784',
      },
      'iBGT BERA': {
        address: '0x3df3d22b997b052fed9d5b7852a69857a18b2f35',
        init_block: '135983325',
      },
      'Bullas': {
        address: '0x035138efbce8bceea1d02a29ed34b66d48b28c2d',
        init_block: '135983321',
      },
    },
    enabled: true,
    blockStep: 45000,
    useFork: true,
    useOldMarketAbi: true,
  },
  [Networks.BERACHAIN]: {
    rpc_url: process.env.BERACHAIN_RPC_URLS?.split(',')[0] || 'https://bepolia.rpc.berachain.com',
    fork_rpc_url: process.env.BERACHAIN_FORK_RPC_URL?.split(',')[0] || 'https://bepolia.rpc.berachain.com',
    markets: {},
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