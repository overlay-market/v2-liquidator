import { parentPort, workerData } from 'worker_threads';
import { ethers } from 'ethers';
import {
  multicall2_address,
  olv_state_address,
} from './constants';
import market_state_abi from './abis/market_state_abi.json'
import multicall2_abi from './abis/multicall2_abi.json'

const BATCH_SIZE = 300;

interface Position {
  positionId: string;
  owner: string;
}

interface MulticallResult {
  blockNumber: number;
  returnData: string[];
}

interface LiquidatableResult {
  position: Position;
  isLiquidatable: boolean;
}

const checkLiquidations = async (positions: Position[], marketAddress: string) => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const ovlMarketStateContract = new ethers.Contract(olv_state_address, market_state_abi, provider)
  const multicall2Contract = new ethers.Contract(multicall2_address, multicall2_abi, provider)

  const calls = positions.map(position => ({
    target: ovlMarketStateContract.address,
    callData: ovlMarketStateContract.interface.encodeFunctionData("liquidatable", [
      marketAddress,
      position.owner,
      parseInt(position.positionId)
    ])
  }));

  const batchPromises: Promise<LiquidatableResult[]>[] = [];

  for (let i = 0; i < positions.length; i += BATCH_SIZE) {
    const batchPositions = positions.slice(i, i + BATCH_SIZE);
    
    // Add the multicall batch promise to the array
    batchPromises.push(
      multicall2Contract.aggregate(calls.slice(i, i + BATCH_SIZE)).then((result: MulticallResult) => {
        return result.returnData.map((data, index) => {
          const isLiquidatable = ovlMarketStateContract.interface.decodeFunctionResult("liquidatable", data)[0];
          return {
            position: batchPositions[index],
            isLiquidatable: isLiquidatable
          };
        }).filter((result: LiquidatableResult) => result.isLiquidatable);
      })
    );
  }

  const results = await Promise.all(batchPromises);
  const liquidatableResults = results.flat();

  console.log('Liquidatable positions:', JSON.stringify(liquidatableResults));
  return liquidatableResults;
}

checkLiquidations(workerData.positions, workerData.marketAddress)
  .then(results => {
    if (parentPort) parentPort.postMessage(results);
  })
  .catch(error => {
    if (parentPort) parentPort.postMessage({ error: error.message });
  });