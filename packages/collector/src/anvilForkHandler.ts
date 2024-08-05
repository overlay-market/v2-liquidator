import { spawn, execSync } from 'child_process'
import fs from 'fs'
import chalk from 'chalk'

const log = console.log

let anvilProcess: ReturnType<typeof spawn> | null = null

export function startAnvil(forkUrl: string) {
  log(chalk.bold.blue('Starting Anvil...'))

  try {
    const out = fs.openSync('anvil.log', 'a')
    const err = fs.openSync('anvil.log', 'a')

    anvilProcess = spawn(
      'anvil',
      ['--fork-url', forkUrl, '--port=8545', '--host=0.0.0.0'],
      {
        stdio: ['ignore', out, err], // Redirect stdout and stderr to anvil.log
      }
    )

    anvilProcess.on('error', (error) => {
      log(chalk.bold.red('Error starting Anvil:', error))
      anvilProcess = null
      throw error
    })

    log(chalk.bold.blue('Waiting for Anvil to be fully up and running...'))
    execSync('sleep 10') // Sleep for 5 seconds (adjust if necessary)
  } catch (error) {
    log(chalk.bold.red('Error starting Anvil:', error))
    if (anvilProcess) {
      anvilProcess.kill()
      anvilProcess = null
    }
    throw error
  }
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
