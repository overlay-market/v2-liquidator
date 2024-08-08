import { ethers } from 'ethers'
import chalk from 'chalk'

export async function checkRpc(rpcUrl: string): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  await provider.getBlockNumber()
  return rpcUrl
}

export async function checkRpcList(rpcUrls: string[]): Promise<string | null> {
  for (const url of rpcUrls) {
    try {
      return await checkRpc(url)
    } catch (error) {
      console.log(chalk.bgRed('error checking rpc health:', url, error))
    }
  }
  return null
}

export async function selectRpc(rpcUrls: string[], primaryRpcProbability: number): Promise<string> {
  const totalUrls = rpcUrls.length
  if (totalUrls === 0) throw new Error('No RPC URLs provided')

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
      throw new Error('No healthy RPC found after checking all')
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
      throw new Error('No healthy RPC found after checking all')
    }
  }
}
