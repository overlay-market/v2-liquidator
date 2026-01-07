jest.mock('./redisHandler', () => {
  const resolved = (value?: any) => jest.fn().mockResolvedValue(value)
  return {
    __esModule: true,
    default: {
      incr: resolved(0),
      srem: resolved(1),
      lpush: resolved('ok'),
      del: resolved(),
    },
    redisBlocking: {
      brpop: resolved(['liquidatable_positions', '']),
    },
  }
})

import { __test } from './executorHandler'
import redis from './redisHandler'
import { Networks, Position } from './constants'

describe('handleFailedAttempt retry flow', () => {
  const basePosition: Position = {
    positionId: '1',
    owner: '0xowner',
    marketAddress: '0xmarket',
    network: Networks.BSC_MAINNET,
  }

  let liquidatableMock: jest.Mock

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    liquidatableMock = jest.fn().mockResolvedValue(true)
    __test.setLiquidatableCheck(liquidatableMock)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('requeues with backoff when retry window not completed', async () => {
    ;(redis.incr as jest.Mock).mockResolvedValue(1)
    liquidatableMock.mockResolvedValue(true)

    await __test.handleFailedAttempt(basePosition)

    expect(liquidatableMock).not.toHaveBeenCalled()
    expect(redis.lpush).not.toHaveBeenCalled()

    jest.runOnlyPendingTimers()

    expect(redis.lpush).toHaveBeenCalledWith(
      'liquidatable_positions',
      JSON.stringify(basePosition)
    )
  })

  test('removes and allows rediscovery when no longer liquidatable after retry window', async () => {
    ;(redis.incr as jest.Mock).mockResolvedValue(__test.MAX_RETRIES)
    liquidatableMock.mockResolvedValue(false)

    await __test.handleFailedAttempt(basePosition)

    expect(liquidatableMock).toHaveBeenCalled()
    expect(redis.srem).toHaveBeenCalledWith(
      'unique_positions',
      `${basePosition.network}:${basePosition.marketAddress}:${basePosition.positionId}`
    )
    expect(redis.del).toHaveBeenCalled()

    jest.runOnlyPendingTimers()
    expect(redis.lpush).not.toHaveBeenCalled()
  })

  test('alerts and keeps retrying when still liquidatable after retry window', async () => {
    ;(redis.incr as jest.Mock).mockResolvedValue(__test.MAX_RETRIES)
    liquidatableMock.mockResolvedValue(true)
    const reportSpy = jest.fn().mockResolvedValue(undefined)
    __test.setReportLiquidationError(reportSpy)

    await __test.handleFailedAttempt({ ...basePosition, lastErrorType: 'Gas Error' })

    expect(liquidatableMock).toHaveBeenCalled()
    expect(reportSpy).toHaveBeenCalledWith(
      expect.objectContaining({ positionId: basePosition.positionId }),
      __test.MAX_RETRIES,
      'Gas Error'
    )

    jest.runOnlyPendingTimers()
    expect(redis.lpush).toHaveBeenCalledWith(
      'liquidatable_positions',
      JSON.stringify({ ...basePosition, lastErrorType: 'Gas Error' })
    )

  })
})
