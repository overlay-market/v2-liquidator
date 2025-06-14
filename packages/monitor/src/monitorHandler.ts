import dotenv from 'dotenv'
import chalk from 'chalk'
import redis from './redisHandler'
import { ethers } from 'ethers'
import TelegramBot from 'node-telegram-bot-api'
import { networkConfig, erc20ABI, Networks, ChainId } from './constants'
import axios from 'axios'

dotenv.config()

const log = console.log

let bot: TelegramBot

if (process.env.TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
  log(chalk.green('Telegram bot initialized'))
} else {
  log(chalk.bold.red('TELEGRAM_BOT_TOKEN must be provided'))
}

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
  executorAddresses: string[]
}

async function fetchMarkets(network: Networks): Promise<{ [key: string]: string }> {
  try {
    const response = await axios.get(networkConfig[network].apiUrl)
    const marketsData = response.data
    const chainId = ChainId[network]
    const marketsArray = marketsData[chainId] || []

    const markets: { [key: string]: string } = {}
    for (const market of marketsArray) {
      if (market.chains && market.chains.length > 0) {
        const deploymentAddress = market.chains[0].deploymentAddress
        const marketName = market.marketName
        if (deploymentAddress && marketName) {
          markets[deploymentAddress.toLowerCase()] = marketName.replace('-', '\\-')
        } else if (deploymentAddress) {
          markets[deploymentAddress.toLowerCase()] = deploymentAddress
        }
      }
    }

    return markets
  } catch (error) {
    console.error('Error fetching markets:', error)
    return {}
  }
}

async function sendTelegramMessage(message: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    log(chalk.bold.red('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be provided'))
    return
  }

  await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, { parse_mode: 'MarkdownV2' })
}

async function getLiquidatorStats(
  markets: { [key: string]: string },
  network: Networks
): Promise<LiquidatorStats | undefined> {
  const totalLiquidatedPositions = (await redis.get(`total_liquidated_positions:${network}:total`)) || '0'
  const liquidatedPositions = (await redis.get(`liquidated_positions:${network}:total`)) || '0'
  const liquidatablePositionsFound = (await redis.get(`liquidatable_positions_found:${network}:total`)) || '0'

  if (liquidatedPositions === '0') {
    return
  }

  // get data by market
  let dataByMarket: { [key: string]: MarketData } = {}

  for (const market of Object.keys(markets)) {
    const totalLiquidatedPositionsByMarket =
      (await redis.get(`total_liquidated_positions:${network}:${market.toLowerCase()}`)) || '0'
    const liquidatedPositionsByMarket =
      (await redis.get(`liquidated_positions:${network}:${market.toLowerCase()}`)) || '0'
    const liquidatablePositionsFoundByMarket =
      (await redis.get(`liquidatable_positions_found:${network}:${market.toLowerCase()}`)) || '0'

    if (liquidatedPositionsByMarket === '0') {
      continue
    }

    dataByMarket[market] = {
      totalLiquidatedPositions: parseInt(totalLiquidatedPositionsByMarket),
      liquidatedPositions: parseInt(liquidatedPositionsByMarket),
      liquidatablePositionsFound: parseInt(liquidatablePositionsFoundByMarket),
    }
  }

  // get data by executor
  const provider = new ethers.providers.JsonRpcProvider(networkConfig[network].rpcUrl)
  const ovContract = new ethers.Contract(
    networkConfig[network].ov_token_address,
    erc20ABI,
    provider
  )

  let dataByExecutor: { [key: string]: ExecutorData } = {}

  const keys = await redis.keys(`total_liquidated_positions_by_executor:${network}:*`)
  const executorAddresses = keys.map((key) => key.split(':')[2])

  for (const executor of executorAddresses) {
    const totalLiquidatedPositionsByExecutor =
      (await redis.get(`total_liquidated_positions_by_executor:${network}:${executor}`)) || '0'
    const liquidatedPositionsByExecutor =
      (await redis.get(`liquidated_positions_by_executor:${network}:${executor}`)) || '0'
    const ethBalance = await provider.getBalance(executor)
    const ovRewardsClaimed = await ovContract.balanceOf(executor)

    const prevOvBalance = (await redis.get(`ov_balance:${network}:${executor}`)) || '0'
    const ovRewardsClaimedDiff = ethers.BigNumber.from(ovRewardsClaimed).sub(
      ethers.BigNumber.from(prevOvBalance)
    )
    await redis.set(`ov_balance:${network}:${executor}`, ovRewardsClaimed.toString())

    dataByExecutor[executor] = {
      totalLiquidatedPositions: parseInt(totalLiquidatedPositionsByExecutor),
      liquidatedPositions: parseInt(liquidatedPositionsByExecutor),
      ethBalance: ethers.utils.formatEther(ethBalance),
      ovBalance: ethers.utils.formatUnits(ovRewardsClaimed, 18),
      ovRewardsClaimed: ethers.utils.formatUnits(ovRewardsClaimedDiff, 18),
    }
  }

  const prevTimestamp = (await redis.get('liquidator_report_timestamp')) || ''

  return {
    totalLiquidatedPositions: parseInt(totalLiquidatedPositions),
    liquidatedPositions: parseInt(liquidatedPositions),
    liquidatablePositionsFound: parseInt(liquidatablePositionsFound),
    dataByMarket,
    dataByExecutor,
    prevTimestamp,
    executorAddresses,
  }
}

function createLiquidatorReportMessage(
  stats: LiquidatorStats,
  markets: { [key: string]: string },
  network: Networks
): string {
  let displayName = network as string;
  if (network === Networks.BSC_TESTNET) {
    displayName = 'bsc testnet';
  }
  let message = `📋 *Liquidator Report for ${displayName}* 📋\n`;
  message += `from: ${
    stats.prevTimestamp ? new Date(parseInt(stats.prevTimestamp)).toUTCString() : 'N/A'
  }\n`
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
  for (const executor of stats.executorAddresses) {
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

async function resetAllData(
  executorAddresses: string[],
  markets: { [key: string]: string },
  network: Networks
) {
  console.log(chalk.blue('Resetting data...'))

  await redis.set(`liquidated_positions:${network}:total`, '0')
  await redis.set(`liquidatable_positions_found:${network}:total`, '0')

  for (const market of Object.keys(markets)) {
    await redis.set(`liquidated_positions:${network}:${market}`, '0')
    await redis.set(`liquidatable_positions_found:${network}:${market}`, '0')
  }

  for (const executor of executorAddresses) {
    await redis.set(`liquidated_positions:${network}:${executor}`, '0')
  }
}

export async function sendLiquidatorReport() {
  log(chalk.blue('Creating liquidator report...'))

  for (const network of Object.keys(networkConfig) as Networks[]) {
    const markets = await fetchMarkets(network)
    const stats = await getLiquidatorStats(markets, network)

    if (!stats) {
      log(chalk.yellow('No liquidatable positions found for', network))
      continue
    }

    const message = createLiquidatorReportMessage(stats, markets, network)

    try {
      log(chalk.blue('Sending liquidator report...'))
      await sendTelegramMessage(message)
    } catch (error) {
      log(chalk.bgRed('Error sending liquidator report:', error))
      return
    }

    await resetAllData(stats.executorAddresses, markets, network)
  }

  await redis.set('liquidator_report_timestamp', Date.now().toString())

  log(chalk.green('Liquidator report sent successfully'))
}
