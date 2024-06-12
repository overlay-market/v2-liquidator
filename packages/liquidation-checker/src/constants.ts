export const markets: {[key: string]: string} = {
  'ETH Dominance': '0x3a204d03e9B1fEE01b8989333665b6c46Cc1f79E',
  'BTC Dominance': '0x553de578e68a4faa55d4522665cb2d2d53390d22',
  'Quantum Cats': '0x4EDFB4057F3a448B2704dF1A3665Db4AE6371B69',
  'CS2 Skins': '0x6aa41b8f2f858723aafcf388a90d34d1cb1162d9',
  'Bitcoin Frogs': '0xC7f3240d983fcAB7A571bE484d2b4dA43B95efEe',
  'Ink': '0xe060ea13b2e710cefc5124bb790db4823b0f602a',
  'NodeMonkes': '0xef898dbf4F4D75bdfbDd85F781A6C1BF8EDaF0AE',
  'EvIndex': '0x770E3A8afC5c01855b5bD8EB5b96b23bd7Af1e43',
  'AiIndex': '0xad90fFf9D159e18CEc2048Dd6881e29886e4899E',
}

export const markets_block: {[key: string]: string} = {
  'ETH Dominance': '12600256',
  'BTC Dominance': '2163024',
  'Quantum Cats': '16499215',
  'CS2 Skins': '1590839',
  'Bitcoin Frogs': '16498932',
  'Ink': '29178446',
  'NodeMonkes': '16499121',
  'EvIndex': '48459493',
  'AiIndex': '54018512',
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

export const multicall_address = '0x2B718b475e385eD29F56775a66aAB1F5cC6B2A0A'
export const multicall2_address = '0xA115146782b7143fAdB3065D86eACB54c169d092'
export const olv_state_address = '0x2878837ea173e8bd40db7cee360b15c1c27deb5a'