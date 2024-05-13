# Liquidator Bot V2

The liquidator bot will be composed of different modules that will be responsible for different tasks.

## Collector

This module will be responsible for collecting the data from the events emitted by the smart contract and storing it in a Redis cache.

The collector will store only open positions.

## LiquidationChecker

This module will be responsible for validating the open positions and marking them for liquidation.

The LiquidationChecker will use the liquidatable function from the smart contract to check if the position is liquidatable.

If a position is liquidatable, the liquidator will mark the position for liquidation in the Redis queue. Then the module will notify the executor to liquidate the position.

## Executor

The executor will be pending for new liquidable positions in the Redis queue.

When a new liquidable position is found, the executor will call the liquidate function from the smart contract to liquidate the position.

## Architecture

Each module is a node.js application.

We will use docker compose to run all the modules and Redis.

## How to run

1. Install docker and docker-compose
2. Run `docker-compose up`

## How to develop

1. Install node.js, docker, redis and pnpm
2. Run `pnpm install`
3. Set the environment variables in the `.env` file for each module
4. Set the redis to run in localhost. You can do this by running `docker run -p 6379:6379 redis` or installing redis in your machine.
5. You can test the modules separately by running `pnpm dev` in each module

## Environment variables
REDIS_PASSWORD - The password of the redis server (if required)
RPC_URL - The RPC URL of the arbitrum network