import Redis from 'ioredis'
import dotenv from 'dotenv'
import chalk from 'chalk'

dotenv.config()

const redis = new Redis({
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  connectTimeout: 10000, // 10 seconds timeout
  maxRetriesPerRequest: 5, // limit the number of retries for each request
  retryStrategy: times => {
    if (times >= 5) {
      return null // stop retrying after 5 attempts
    }
    return Math.min(times * 100 + Math.random() * 100, 2000) // Add jitter for better distribution
  },
  reconnectOnError: (err) => {
    const targetError = "READONLY"
    if (err.message.includes(targetError)) {
      return true // explicitly return true
    }
    return false // explicitly return false
  },
  enableAutoPipelining: true, // Enable auto pipelining for better performance
})

redis.on('error', (error) => {
  console.error(chalk.red('Redis error:', error))
})

export default redis
