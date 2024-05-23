import { ethers } from 'ethers'
import chalk from 'chalk'
import dotenv from 'dotenv'

dotenv.config()

// probability of using the primary RPC, defaulting to 0.75
const primaryRpcProbability = parseFloat(process.env.RPC_FIRST_PROBABILITY ?? '0.75')

export async function checkRpc(rpcUrl: string) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  await provider.getBlockNumber()
  return rpcUrl
}

export async function checkRpcList(rpcUrls: string[]) {
  for (const url of rpcUrls) {
    try {
      return await checkRpc(url)
    } catch (error) {
      console.log(chalk.bgRed('error checking rpc health:', url, error))
    }
  }
  return null
}

export async function selectRpc(rpcUrls: string[]) {
  const totalUrls = rpcUrls.length
  if (totalUrls === 0) return null

  // determine if taking the first rpc or selecting from the others
  const takeFirstRpc = Math.random() < primaryRpcProbability

  if (takeFirstRpc) {
    // try the first rpc
    try {
      return await checkRpc(rpcUrls[0])
    } catch (error) {
      console.log(chalk.bgRed('error checking first rpc health:', rpcUrls[0], error))
      // try the rest if the first fails
      const result = await checkRpcList(rpcUrls.slice(1))
      if (result) return result
      throw new Error('no healthy rpc found after checking all')
    }
  } else {
    // try the rest of the rpcs first
    const result = await checkRpcList(rpcUrls.slice(1))
    if (result) return result
    // if all fail, try the first one before throwing an error
    try {
      return await checkRpc(rpcUrls[0])
    } catch (error) {
      console.log(chalk.bgRed('error checking first rpc health:', rpcUrls[0], error))
      throw new Error('no healthy rpc found after checking all')
    }
  }
}
