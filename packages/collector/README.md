# Collector

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

4. Compile the typescript files
```bash
pnpm build
```

5. Run locally.

The Collector is a cron job that will run periodically. To run as a normal node.js script, you can comment the `cron.schedule` line in the `index.ts` file and uncomment the `fetchAndProcessEventsForAllMarkets` function.

```typescript
// Schedule the cron job to run every 2 minutes
cron.schedule('*/2 * * * *', fetchAndProcessEventsForAllMarkets)

// run fetchAndProcessEventsForAllMarkets() once to fetch events for all markets
// fetchAndProcessEventsForAllMarkets()
```

## Considerations

If the Collector will run for first time, it will fetch all the events from all the markets. This can take a long time and a lot of requests to the RPC node. So, it is recommended to run a fork of the network and use as a local RPC node.

Using Foundry Anvil
```bash
anvil --fork-url https://arbitrum-sepolia-rpc.publicnode.com --port=8545 --host=0.0.0.0
```

Then set the `RPC_URLS` environment variable to `http://localhost:8545` in the `.env` file.
