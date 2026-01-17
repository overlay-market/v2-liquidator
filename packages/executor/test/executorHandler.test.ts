import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ethers } from 'ethers'
import redis from '../src/redisHandler'
import { Position, Networks } from '../src/constants'

// Mock environment variables
process.env.PRIVATE_KEYS = '0x1234567890123456789012345678901234567890123456789012345678901234'
process.env.TELEGRAM_BOT_TOKEN = 'test_token'
process.env.TELEGRAM_CHAT_ID = 'test_chat_id'
process.env.BSC_MAINNET_EXECUTOR_RPC_URL = 'https://test-rpc.com'

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    green: vi.fn((text: string) => text),
    red: vi.fn((text: string) => text),
    blue: vi.fn((text: string) => text),
    yellow: vi.fn((text: string) => text),
    bold: {
      red: vi.fn((text: string) => text),
      blue: vi.fn((text: string) => text),
    },
    bgGreen: vi.fn((text: string) => text),
    bgRed: vi.fn((text: string) => text),
    bgBlue: vi.fn((text: string) => text),
  },
}))

// Mock console.log
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
}

// Mock Redis
vi.mock('../src/redisHandler', () => ({
  default: {
    hdel: vi.fn(),
    zrem: vi.fn(),
    zadd: vi.fn(),
    zrangebyscore: vi.fn(),
    lpush: vi.fn(),
    brpop: vi.fn(),
    exists: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
  },
}))

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    Wallet: vi.fn(),
    providers: {
      JsonRpcProvider: vi.fn(),
    },
    Contract: vi.fn(),
  },
}))

// Mock TelegramBot
vi.mock('node-telegram-bot-api', () => ({
  default: vi.fn().mockImplementation(() => ({
    sendMessage: vi.fn(),
  })),
}))

// Import the functions we want to test
import {
  checkIfPositionStillLiquidatable,
  isMarketError,
  removePositionFromRedis,
  liquidatePosition,
  liquidablePositionsListener,
} from '../src/executorHandler'

describe('Executor Handler Tests', () => {
  const mockPosition: Position = {
    positionId: '123',
    owner: '0x1234567890123456789012345678901234567890',
    marketAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    network: Networks.BSC_MAINNET,
  }

  const mockProvider = {
    getTransactionCount: vi.fn(),
  }

  const mockWallet = {
    address: '0x1234567890123456789012345678901234567890',
  }

  const mockMarketContract = {
    liquidate: vi.fn(),
    connect: vi.fn().mockReturnThis(),
    interface: {
      decodeFunctionResult: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(ethers.Wallet).mockReturnValue(mockWallet as any)
    vi.mocked(ethers.providers.JsonRpcProvider).mockReturnValue(mockProvider as any)
    vi.mocked(ethers.Contract).mockReturnValue(mockMarketContract as any)
    
    // Mock provider methods
    mockProvider.getTransactionCount.mockResolvedValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isMarketError', () => {
    it('should detect OVLV1:!data error in error.message', async () => {
      const error = { message: 'execution reverted: OVLV1:!data' }
      const result = await isMarketError(error)
      expect(result).toBe(true)
    })

    it('should detect OVLV1:!data error in error.error.message', async () => {
      const error = { error: { message: 'execution reverted: OVLV1:!data' } }
      const result = await isMarketError(error)
      expect(result).toBe(true)
    })

    it('should return false for non-market errors', async () => {
      const error = { message: 'insufficient funds' }
      const result = await isMarketError(error)
      expect(result).toBe(false)
    })

    it('should return false for undefined error', async () => {
      const result = await isMarketError(undefined)
      expect(result).toBe(false)
    })
  })

  describe('checkIfPositionStillLiquidatable', () => {
    it('should return true when position is still liquidatable', async () => {
      const mockOvlContract = {
        liquidatable: vi.fn().mockResolvedValue(true),
      }
      vi.mocked(ethers.Contract).mockReturnValue(mockOvlContract as any)

      const result = await checkIfPositionStillLiquidatable(mockPosition)
      expect(result).toBe(true)
    })

    it('should return false when position is no longer liquidatable', async () => {
      const mockOvlContract = {
        liquidatable: vi.fn().mockResolvedValue(false),
      }
      vi.mocked(ethers.Contract).mockReturnValue(mockOvlContract as any)

      const result = await checkIfPositionStillLiquidatable(mockPosition)
      expect(result).toBe(false)
    })

    it('should return false when contract call fails', async () => {
      const mockOvlContract = {
        liquidatable: vi.fn().mockRejectedValue(new Error('RPC Error')),
      }
      vi.mocked(ethers.Contract).mockReturnValue(mockOvlContract as any)

      const result = await checkIfPositionStillLiquidatable(mockPosition)
      expect(result).toBe(false)
    })
  })

  describe('removePositionFromRedis', () => {
    it('should remove position from all Redis structures', async () => {
      await removePositionFromRedis(mockPosition)

      expect(redis.hdel).toHaveBeenCalledWith(
        `positions:${mockPosition.network}:${mockPosition.marketAddress}`,
        mockPosition.positionId
      )
      expect(redis.zrem).toHaveBeenCalledWith(
        `position_index:${mockPosition.network}:${mockPosition.marketAddress}`,
        mockPosition.positionId
      )
    })
  })

  describe('liquidatePosition - Success Path', () => {
    it('should successfully liquidate position', async () => {
      const mockReceipt = { status: 1, transactionHash: '0xhash' }
      const mockTransaction = {
        wait: vi.fn().mockResolvedValue(mockReceipt),
      }
      
      mockMarketContract.liquidate.mockResolvedValue(mockTransaction)

      vi.mocked(redis.hdel).mockResolvedValue(1)
      vi.mocked(redis.zrem).mockResolvedValue(1)
      vi.mocked(redis.incr).mockResolvedValue(1)

      await liquidatePosition(mockPosition)

      expect(mockMarketContract.liquidate).toHaveBeenCalledWith(
        mockPosition.owner,
        mockPosition.positionId
      )
      expect(redis.hdel).toHaveBeenCalled()
      expect(redis.zrem).toHaveBeenCalled()
    })
  })

  describe('liquidatePosition - Error Paths', () => {
    beforeEach(() => {
      mockMarketContract.liquidate.mockRejectedValue(new Error('Transaction failed'))
    })

    it('should handle market error (OVLV1:!data) and queue for retry with 7 minutes delay', async () => {
      const mockOvlContract = {
        liquidatable: vi.fn().mockResolvedValue(true),
      }
      vi.mocked(ethers.Contract).mockReturnValue(mockOvlContract as any)

      vi.mocked(redis.zadd).mockResolvedValue(1)

      await liquidatePosition(mockPosition)

      expect(redis.zadd).toHaveBeenCalledWith(
        'delayed_positions',
        expect.any(Number),
        JSON.stringify(mockPosition)
      )
      
      const callArgs = vi.mocked(redis.zadd).mock.calls[0]
      const timestamp = Number(callArgs[1])
      const delay = timestamp - Date.now()
      expect(delay).toBeGreaterThan(6.5 * 60 * 1000)
      expect(delay).toBeLessThan(7.5 * 60 * 1000)
    })

    it('should handle non-market error and queue for retry with 3 minutes delay', async () => {
      const mockOvlContract = {
        liquidatable: vi.fn().mockResolvedValue(true),
      }
      vi.mocked(ethers.Contract).mockReturnValue(mockOvlContract as any)

      vi.mocked(redis.zadd).mockResolvedValue(1)

      await liquidatePosition(mockPosition)

      expect(redis.zadd).toHaveBeenCalledWith(
        'delayed_positions',
        expect.any(Number),
        JSON.stringify(mockPosition)
      )
      
      const callArgs = vi.mocked(redis.zadd).mock.calls[0]
      const timestamp = Number(callArgs[1])
      const delay = timestamp - Date.now()
      expect(delay).toBeGreaterThan(2.5 * 60 * 1000)
      expect(delay).toBeLessThan(3.5 * 60 * 1000)
    })

    it('should remove position immediately when no longer liquidatable', async () => {
      const mockOvlContract = {
        liquidatable: vi.fn().mockResolvedValue(false),
      }
      vi.mocked(ethers.Contract).mockReturnValue(mockOvlContract as any)

      vi.mocked(redis.hdel).mockResolvedValue(1)
      vi.mocked(redis.zrem).mockResolvedValue(1)

      await liquidatePosition(mockPosition)

      expect(redis.hdel).toHaveBeenCalled()
      expect(redis.zrem).toHaveBeenCalled()
    })
  })

  describe('liquidablePositionsListener - Real Flow Tests', () => {
    it('should process delayed positions first, then check for new positions', async () => {
      // Mock delayed positions ready to retry
      vi.mocked(redis.zrangebyscore).mockResolvedValue([JSON.stringify(mockPosition)])
      vi.mocked(redis.zrem).mockResolvedValue(1)
      
      // Mock no new positions available
      vi.mocked(redis.brpop).mockResolvedValue(null)

      // Mock successful liquidation for delayed position
      const mockReceipt = { status: 1, transactionHash: '0xhash' }
      const mockTransaction = {
        wait: vi.fn().mockResolvedValue(mockReceipt),
      }
      mockMarketContract.liquidate.mockResolvedValue(mockTransaction)

      vi.mocked(redis.hdel).mockResolvedValue(1)
      vi.mocked(redis.incr).mockResolvedValue(1)

      // Start the listener (it will run one iteration)
      const listenerPromise = liquidablePositionsListener()
      
      // Wait a bit for the first iteration
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify both queues were processed
      expect(redis.zrangebyscore).toHaveBeenCalledWith('delayed_positions', 0, expect.any(Number), 'LIMIT', 0, 1)
      expect(redis.brpop).toHaveBeenCalledWith('liquidatable_positions', 1)
      
      // Clean up
      vi.mocked(redis.brpop).mockRejectedValue(new Error('Stop listener'))
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    it('should process new positions when available', async () => {
      // Mock no delayed positions ready
      vi.mocked(redis.zrangebyscore).mockResolvedValue([])
      
      // Mock new position available
      vi.mocked(redis.brpop).mockResolvedValue(['liquidatable_positions', JSON.stringify(mockPosition)])

      // Mock successful liquidation
      const mockReceipt = { status: 1, transactionHash: '0xhash' }
      const mockTransaction = {
        wait: vi.fn().mockResolvedValue(mockReceipt),
      }
      mockMarketContract.liquidate.mockResolvedValue(mockTransaction)

      vi.mocked(redis.hdel).mockResolvedValue(1)
      vi.mocked(redis.incr).mockResolvedValue(1)

      // Start the listener (it will run one iteration)
      const listenerPromise = liquidablePositionsListener()
      
      // Wait a bit for the first iteration
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify new position was processed
      expect(mockMarketContract.liquidate).toHaveBeenCalledWith(
        mockPosition.owner,
        mockPosition.positionId
      )
      
      // Clean up
      vi.mocked(redis.brpop).mockRejectedValue(new Error('Stop listener'))
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    it('should handle both queues independently every second', async () => {
      // Mock delayed positions ready
      vi.mocked(redis.zrangebyscore).mockResolvedValue([JSON.stringify(mockPosition)])
      vi.mocked(redis.zrem).mockResolvedValue(1)
      
      // Mock no new positions available
      vi.mocked(redis.brpop).mockResolvedValue(null)

      // Mock successful liquidation for delayed position
      const mockReceipt = { status: 1, transactionHash: '0xhash' }
      const mockTransaction = {
        wait: vi.fn().mockResolvedValue(mockReceipt),
      }
      mockMarketContract.liquidate.mockResolvedValue(mockTransaction)

      vi.mocked(redis.hdel).mockResolvedValue(1)
      vi.mocked(redis.incr).mockResolvedValue(1)

      // Start the listener (it will run one iteration)
      const listenerPromise = liquidablePositionsListener()
      
      // Wait a bit for the first iteration
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify both queues were processed independently
      expect(redis.zrangebyscore).toHaveBeenCalledWith('delayed_positions', 0, expect.any(Number), 'LIMIT', 0, 1)
      expect(redis.brpop).toHaveBeenCalledWith('liquidatable_positions', 1)
      
      // Clean up
      vi.mocked(redis.brpop).mockRejectedValue(new Error('Stop listener'))
      await new Promise(resolve => setTimeout(resolve, 100))
    })
  })
})
