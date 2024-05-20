# Executor

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

```bash
pnpm dev
```
