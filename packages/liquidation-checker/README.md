# Liquidation Checker

## Development

1. Set up your redis server. You can run a redis server locally by running the following command:
```bash
docker run -p 6379:6379 redis
```

2. Install dependencies
```bash
pnpm install
```

3. Set the environment variables in the `.env` file
```bash
cp .env.example .env
```

- `RPC_URLS` is a comma separated list of RPC URLs for the network you want to use.

- `POSITIONS_PER_RUN` is the number of positions to process in a single run of the collector. For example, if there are 300k positions to process and `POSITIONS_PER_RUN` is set to 50k, the collector will run 6 times to process all the positions.

- `MULTICALL_BATCH_SIZE` is the number of calls to make in a single multicall request. This is used to fetch the liquidation status of multiple positions in a single call. A good value for this is from 200 to 300.

- `WORKERS_AMOUNT` is the number of workers to run in parallel to process the positions. This is useful to speed up the processing of the positions. A good value for this is the number of cores in your machine from 4 to 8.

- `MARKET` is the market to process. Due to the high number of positions to process, it is recommended to process one market at a time. The market should be the market id in the `constants.ts` file.

4. Compile the typescript files
```bash
pnpm build
```

5. Run locally.

The Liquidation Checker is a cron job that will run periodically. To run as a normal node.js script, you can comment the `cron.schedule` line in the `index.ts` file and uncomment the `liquidationChecker` function.

```typescript
// Schedule the cron job to run every 30 seconds
cron.schedule('*/30 * * * * *', liquidationChecker)

// run liquidationChecker() once to fetch events for all markets
// liquidationChecker()
```
Then run:
```bash
pnpm dev
```

## Considerations

The Liquidation Checker is a tool to check the liquidation status of positions in the Arbitrum network. Performs a lot of requests to the RPC node, so it is recommended to use more than one RPC URL to distribute the load. You can use public or private RPC nodes.
