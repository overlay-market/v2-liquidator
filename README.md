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

## Factory Support

The liquidator supports multiple factory and state contract configurations:

### Configured Factories

1. **Original Factory**: `0xC35093f76fF3D31Af27A893CDcec585F1899eE54`
   - State Contract: `0x10575a9C8F36F9F42D7DB71Ef179eD9BEf8Df238`
   - Markets: All existing markets including v2 variants (BTC/USD, ETH/USD, SOL/USD, etc.)

2. **Gambling Factory**: `0x5e6613da86099c264ef9cd56c142506bbf642825`
   - State Contract: `0x6fecbf42b2dcf4bfd3c1c60dcd956247f4abd35e`
   - Markets: "Double or Nothing"

Each market is associated with a specific factory, and the liquidation checker automatically uses the correct state contract based on the market's factory address.

## How to add a new market
Run `pnpm run add-market` and follow the prompts; the helper updates all required files automatically and will ask you to select which factory the market belongs to.

If you prefer to do it manually:
- add the address, deploy block, and factory address of the market smart contract in the `constants.ts` file in the `collector` module
- add the configuration for the market in the `config.ts` file in the `liquidationChecker` module, including the factory address
- create a new `liquidationChecker` instance in the docker-compose file
