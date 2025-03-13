import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 2025;

async function getExecutors() {
  const executors: string[] = [];
  let index = 1;
  
  while (true) {
    const privateKey = process.env[`PRIVATE_KEYS_${index}`];
    if (!privateKey) break;
    
    try {
      const wallet = new ethers.Wallet(privateKey);
      executors.push(wallet.address);
    } catch (error) {
      console.error(`Error processing PRIVATE_KEY_${index}:`, error);
    }
    
    index++;
  }

  return executors;
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