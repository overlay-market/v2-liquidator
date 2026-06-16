import Redis, { RedisOptions } from 'ioredis'
import dotenv from 'dotenv'
import chalk from 'chalk'

dotenv.config()

const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  connectTimeout: 10000, // 10 seconds timeout
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => Math.min(times * 100 + Math.random() * 100, 2000),
  reconnectOnError: (err: Error) => {
    const targetError = "READONLY"
    if (err.message.includes(targetError)) {
      return true // explicitly return true
    }
    return false // explicitly return false
  },
  enableAutoPipelining: true, // Enable auto pipelining for better performance
}

const redis = new Redis(redisOptions)
const redisBlocking = new Redis(redisOptions)

redis.on('error', (error) => {
  console.error(chalk.red('Redis error:', error))
})

redisBlocking.on('error', (error) => {
  console.error(chalk.red('Redis blocking client error:', error))
})

export default redis
export { redisBlocking }
