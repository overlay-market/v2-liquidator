import dotenv from 'dotenv'
import chalk from 'chalk'
import redis from './redisHandler'
import { ethers } from 'ethers'
import TelegramBot from 'node-telegram-bot-api'
import { markets, executorAddresses, rpcURL, OVTokenAddress, erc20ABI} from './constants'

dotenv.config()

const log = console.log

interface MarketData {
  totalLiquidatedPositions: number
  liquidatedPositions: number
  liquidatablePositionsFound: number
}

interface ExecutorData {
  totalLiquidatedPositions: number
  liquidatedPositions: number
  ethBalance: string
  ovBalance: string
  ovRewardsClaimed: string
}

interface LiquidatorStats {
  totalLiquidatedPositions: number
  liquidatedPositions: number
  liquidatablePositionsFound: number
  dataByMarket: { [key: string]: MarketData }
  dataByExecutor: { [key: string]: ExecutorData }
  prevTimestamp: string
}

async function sendTelegramMessage(message: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    log(chalk.bold.red('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be provided'))
    return
  }

  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, { parse_mode: 'MarkdownV2' })
}

async function getLiquidatorStats(): Promise<LiquidatorStats> {
  const totalLiquidatedPositions = (await redis.get('total_liquidated_positions')) || '0'
  const liquidatedPositions = (await redis.get('liquidated_positions')) || '0'
  const liquidatablePositionsFound = (await redis.get('liquidatable_positions_found')) || '0'

  // get data by market
  const dataByMarket: { [key: string]: MarketData } = {}

  for (const market of Object.keys(markets)) {
    const totalLiquidatedPositionsByMarket =
      (await redis.get(`total_liquidated_positions:${market}`)) || '0'
    const liquidatedPositionsByMarket = (await redis.get(`liquidated_positions:${market}`)) || '0'
    const liquidatablePositionsFoundByMarket =
      (await redis.get(`liquidatable_positions_found:${market}`)) || '0'

    dataByMarket[market] = {
      totalLiquidatedPositions: parseInt(totalLiquidatedPositionsByMarket),
      liquidatedPositions: parseInt(liquidatedPositionsByMarket),
      liquidatablePositionsFound: parseInt(liquidatablePositionsFoundByMarket),
    }
  }

  // get data by executor
  const provider = new ethers.providers.JsonRpcProvider(rpcURL)
  const ovContract = new ethers.Contract(OVTokenAddress, erc20ABI, provider)

  const dataByExecutor: { [key: string]: ExecutorData } = {}

  for (const executor of executorAddresses) {
    const totalLiquidatedPositionsByExecutor =
      (await redis.get(`total_liquidated_positions:${executor}`)) || '0'
    const liquidatedPositionsByExecutor = (await redis.get(`liquidated_positions:${executor}`)) || '0'
    const ethBalance = await provider.getBalance(executor)
    const ovRewardsClaimed = await ovContract.balanceOf(executor)

    const prevOvBalance = await redis.get(`ov_balance:${executor}`) || '0'
    const ovRewardsClaimedDiff = ethers.BigNumber.from(ovRewardsClaimed).sub(ethers.BigNumber.from(prevOvBalance))
    await redis.set(`ov_balance:${executor}`, ovRewardsClaimed.toString())

    dataByExecutor[executor] = {
      totalLiquidatedPositions: parseInt(totalLiquidatedPositionsByExecutor),
      liquidatedPositions: parseInt(liquidatedPositionsByExecutor),
      ethBalance: ethers.utils.formatEther(ethBalance),
      ovBalance: ethers.utils.formatUnits(ovRewardsClaimed, 18),
      ovRewardsClaimed: ethers.utils.formatUnits(ovRewardsClaimedDiff, 18),
    }
  }

  const prevTimestamp = await redis.get('liquidator_report_timestamp') || ''

  return {
    totalLiquidatedPositions: parseInt(totalLiquidatedPositions),
    liquidatedPositions: parseInt(liquidatedPositions),
    liquidatablePositionsFound: parseInt(liquidatablePositionsFound),
    dataByMarket,
    dataByExecutor,
    prevTimestamp,
  }
}

function createLiquidatorReportMessage(stats: LiquidatorStats): string {
  let message = `📋 *Liquidator Report* 📋\n`
  message += `from: ${stats.prevTimestamp ? new Date(parseInt(stats.prevTimestamp)).toUTCString() : 'N/A'}\n`
  message += `to: ${new Date().toUTCString()}\n\n`
  message += `*Total Liquidated Positions*: ${stats.totalLiquidatedPositions}\n`
  message += `*Liquidated Positions*: ${stats.liquidatedPositions}\n`
  message += `*Positions Found*: ${stats.liquidatablePositionsFound}\n\n`

  message += `🚀 *Data by Market* 🚀\n\n`
  for (const market of Object.keys(stats.dataByMarket)) {
    const data = stats.dataByMarket[market]
    message += `Ⓜ️ *${markets[market]}*\n`
    message += `Total Liquidated Positions: ${data.totalLiquidatedPositions}\n`
    message += `Liquidated Positions: ${data.liquidatedPositions}\n`
    message += `Positions Found: ${data.liquidatablePositionsFound}\n\n`
  }

  message += `📝 *Data by Executor* 📝\n\n`
  for (const executor of executorAddresses) {
    const data = stats.dataByExecutor[executor]
    message += `🖋️ *Executor*: \`${executor}\`\n`
    message += `Total Liquidated Positions: ${data.totalLiquidatedPositions}\n`
    message += `Liquidated Positions: ${data.liquidatedPositions}\n`
    message += `ETH Balance: ${data.ethBalance.replace('.', '\\.')}\n`
    message += `OV Balance: ${data.ovBalance.replace('.', '\\.')}\n`
    message += `OV Rewards Claimed: ${data.ovRewardsClaimed.replace('.', '\\.')}\n\n`
  }

  console.log(message)
  return message
}

async function resetAllData() {
  console.log(chalk.blue('Resetting data...'))

  await redis.set('liquidated_positions', '0')
  await redis.set('liquidatable_positions_found', '0')

  await redis.set('liquidator_report_timestamp', Date.now().toString())

  for (const market of Object.keys(markets)) {
    await redis.set(`liquidated_positions:${market}`, '0')
    await redis.set(`liquidatable_positions_found:${market}`, '0')
  }

  for (const executor of executorAddresses) {
    await redis.set(`liquidated_positions:${executor}`, '0')
  }
}

export async function sendLiquidatorReport() {
  log(chalk.blue('Creating liquidator report...'))

  const stats = await getLiquidatorStats()
  const message = createLiquidatorReportMessage(stats)
  
  try {
    log(chalk.blue('Sending liquidator report...'))
    await sendTelegramMessage(message)
  } catch (error) {
    log(chalk.bgRed('Error sending liquidator report:', error))
    return
  }

  await resetAllData()

  log(chalk.green('Liquidator report sent successfully'))
}
