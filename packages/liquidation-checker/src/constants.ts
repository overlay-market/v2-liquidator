export interface Position {
  positionId: string
  owner: string
}

export interface MulticallResult {
  blockNumber: number
  returnData: string[]
}

export interface LiquidatableResult {
  position: Position
  isLiquidatable: boolean
  network: Networks
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

export enum Networks {
  ARBITRUM = "arbitrum",
  BERACHAIN = "berachain",
  BSC_TESTNET = "bsc_testnet",
}