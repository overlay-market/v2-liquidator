import { spawn, execSync } from 'child_process'
import fs from 'fs'
import chalk from 'chalk'
import { ethers } from 'ethers'

const log = console.log

let anvilProcess: ReturnType<typeof spawn> | null = null

export function startAnvil() {
  if (!process.env.FORK_RPC_URL) {
    throw new Error('FORK_RPC_URL is not set')
  }

  log(chalk.bold.blue('Starting Anvil...'))

  try {
    const outStream = fs.createWriteStream('anvil.log', { flags: 'a' })
    const errStream = fs.createWriteStream('anvil.log', { flags: 'a' })

    anvilProcess = spawn(
      'anvil',
      ['--fork-url', process.env.FORK_RPC_URL, '--port=8545', '--host=0.0.0.0'],
      {
        stdio: ['pipe', 'pipe', 'pipe'], // use 'pipe' to redirect stdout and stderr
      }
    )

    anvilProcess.stdout?.pipe(outStream) // redirect stdout to the file
    anvilProcess.stdout?.pipe(process.stdout) // redirect stdout to the console
    anvilProcess.stderr?.pipe(errStream) // redirect stderr to the file
    anvilProcess.stderr?.pipe(process.stderr) // redirect stderr to the console

    anvilProcess.on('error', (error) => {
      log(chalk.bold.red('Error starting Anvil:', error))
      anvilProcess = null
      throw error
    })

    log(chalk.bold.blue('Waiting for Anvil to be fully up and running...'))
    execSync('sleep 5') // Sleep for 10 seconds (adjust if necessary)
  } catch (error) {
    log(chalk.bold.red('Error starting Anvil:', error))
    if (anvilProcess) {
      anvilProcess.kill()
      anvilProcess = null
    }
    throw error
  }
}

export async function restartAnvil() {
  if (!process.env.FORK_RPC_URL) {
    throw new Error('FORK_RPC_URL is not set')
  }

  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')

  await provider.send('anvil_reset', [
    {
      forking: {
        jsonRpcUrl: process.env.FORK_RPC_URL,
      },
    },
  ])
}

export async function healthCheckAnvil() {
  if (!anvilProcess) {
    log(chalk.bold.red('Anvil process not found'))
    return false
  }

  if (anvilProcess.killed) {
    log(chalk.bold.red('Anvil process is killed'))
    return false
  }

  let blockNumber: number
  try {
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
    // check last block eth_blockNumber
    blockNumber = await provider.getBlockNumber()
    if (!blockNumber) {
      log(chalk.bold.red('Anvil is not working'))
      return false
    }
  } catch (error) {
    log(chalk.bold.red('Error during Anvil health check:', error))
    return false
  }

  log(chalk.bold.green(`Anvil is healthy, current block number: ${blockNumber}`))
  return true
}

export function stopAnvil() {
  log(chalk.bold.blue('Stopping Anvil...'))
  try {
    if (anvilProcess) {
      anvilProcess.kill()
      anvilProcess = null
      log(chalk.bold.green('Anvil stopped'))
    } else {
      log(chalk.bold.yellow('Anvil process not found, attempting to kill manually'))
      execSync('pkill -f "anvil --fork-url"', { stdio: 'inherit' })
    }
  } catch (error) {
    log(chalk.bold.red('Error stopping Anvil:', error))
  }
}
