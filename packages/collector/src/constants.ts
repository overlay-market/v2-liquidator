export interface Market {
  address: string;
  init_block: string;
}

export const markets: Record<string, Market> = {
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
  }
}

export const markets_block: {[key: string]: string} = {
  'ETH Dominance': '12600256',
  'BTC Dominance': '2163024',
  'Quantum Cats': '16499215',
  'CS2 Skins': '1590839',
  'Bitcoin Frogs': '16498932',
  'Ink': '29178446',
  'NodeMonkes': '16499121',
}

export enum EventType {
  Build = 'Build',
  Unwind = 'Unwind',
  Liquidate = 'Liquidate',
}

export enum PositionStatus {
  New = 'New',
  Updated = 'Updated',
  Removed = 'Removed',
  Error = 'Error',
}