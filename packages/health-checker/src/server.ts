import express from 'express';
import redis from './redisHandler';

const app = express();
const port = process.env.PORT || 2025;

async function getExecutors() {
  const keys = await redis.keys(`total_liquidated_positions_by_executor:${"berachain"}:*`)
  const executorAddresses = keys.map((key) => key.split(':')[2])
  return executorAddresses
}

// Endpoint healthcheck also returns the executors addresses
app.get('/healthcheck', async (req, res) => {
  res.status(200).send({
    status: 'ok',
    executors: await getExecutors()
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});