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
2. Set the environment variables in the `.env` file
3. Run `docker-compose build` to build the images
4. Run `docker-compose up` to run the modules

## How to develop

1. Install node.js, docker, redis and pnpm
2. Run `pnpm install`
3. Set the environment variables in the `.env` file for each module
4. Set redis to run in localhost. You can do this by running `docker run -p 6379:6379 redis` or installing redis in your machine.
5. You can test the modules separately by running `pnpm dev` in each module

## Environment variables
- `RPC_URLS`: Comma separated list of RPC urls
- `REDIS_PASSWORD`: Redis password
- `REDIS_HOST`: Redis host
- `MULTICALL_BATCH_SIZE`: Number of calls to make in a single multicall request
- `FORK_RPC_URL`: RPC url to use for forking
- `PRIVATE_KEYS_1`: Comma separated list of private keys for the first account
- `PRIVATE_KEYS_2`: Comma separated list of private keys for the second account
- `RPC_FIRST_PROBABILITY`: Probability of using the first RPC url in LiquidationChecker module
- `POSITIONS_PER_RUN_*`: Number of positions to check in each cron run
- `WORKERS_AMOUNT_*`: Number of workers to run in parallel for each cron job
- `CRON_SCHEDULE_*`: Cron schedule for each cron job
