export interface MarketConfig {
  positions_per_run: number
  workers: number
  cron_schedule: string
  multicall_batch_size: number
  rpc_first_probability: number
}

export const config: Record<string, MarketConfig> = {
  'ETH Dominance': {
    positions_per_run: 6000,
    workers: 1,
    cron_schedule: '5,35 * * * * *',
    multicall_batch_size: 300,
    rpc_first_probability: 0.70,
  },
  'BTC Dominance': {
    positions_per_run: 4000,
    workers: 1,
    cron_schedule: '9,39 * * * * *',
    multicall_batch_size: 300,
    rpc_first_probability: 0.70,
  },
  'Quantum Cats': {
    positions_per_run: 1000,
    workers: 1,
    cron_schedule: '13,43 * * * * *',
    multicall_batch_size: 300,
    rpc_first_probability: 0.70,
  },
  'CS2 Skins': {
    positions_per_run: 2500,
    workers: 1,
    cron_schedule: '17,47 * * * * *',
    multicall_batch_size: 300,
    rpc_first_probability: 0.70,
  },
  'Bitcoin Frogs': {
    positions_per_run: 1200,
    workers: 1,
    cron_schedule: '21,51 * * * * *',
    multicall_batch_size: 300,
    rpc_first_probability: 0.70,
  },
  Ink: {
    positions_per_run: 1000,
    workers: 1,
    cron_schedule: '25,55 * * * * *',
    multicall_batch_size: 300,
    rpc_first_probability: 0.70,
  },
  NodeMonkes: {
    positions_per_run: 1000,
    workers: 1,
    cron_schedule: '29,59 * * * * *',
    multicall_batch_size: 300,
    rpc_first_probability: 0.70,
  },
  EvIndex: {
    positions_per_run: 1000,
    workers: 1,
    cron_schedule: '1,31 * * * * *',
    multicall_batch_size: 300,
    rpc_first_probability: 0.70,
  },
  dafault: {
    positions_per_run: 1000,
    workers: 1,
    cron_schedule: '1,31 * * * * *',
    multicall_batch_size: 300,
    rpc_first_probability: 0.70,
  },
}
