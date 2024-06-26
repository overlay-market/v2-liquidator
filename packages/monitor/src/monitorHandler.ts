import dotenv from 'dotenv'
import chalk from 'chalk'
import redis from './redisHandler'
import TelegramBot from 'node-telegram-bot-api'

dotenv.config()

const log = console.log

enum EventType {
  Error = 'error',
  Info = 'info',
  Success = 'success',
}

interface Event {
  type: EventType
  message: string
}

async function sendTelegramMessage(event: Event) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    log(chalk.bold.red('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be provided'))
    return
  }

  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  bot.sendMessage(process.env.TELEGRAM_CHAT_ID, event.message)
}

export async function liquidatorEventsListener() {
  if (!process.env.RPC_URLS) {
    log(chalk.bold.red('At least one RPC_URLS must be provided'))
    return
  }

  log(chalk.bold.blue('Monitor started at:', new Date().toLocaleString()))
  log(chalk.blue('Listening for new events...'))

  while (true) {
    try {
      const result = await redis.brpop('liquidator_events', 0)
      if (result) {
        const [key, eventData] = result
        const event = JSON.parse(eventData) as Event

        log(chalk.bold('New event received!'))
        if (event.type === EventType.Error) {
          log(`${chalk.bgRed('Error:')} ${chalk.red(event.message)}`)
        } else if (event.type === EventType.Info) {
          log(`${chalk.bgBlue('Info:')} ${chalk.blue(event.message)}`)
        } else if (event.type === EventType.Success) {
          log(`${chalk.bgGreen('Success:')} ${chalk.green(event.message)}`)
        }

        await sendTelegramMessage(event)
      }
    } catch (error) {
      console.error('Error processing event:', error)
    }
  }
}
