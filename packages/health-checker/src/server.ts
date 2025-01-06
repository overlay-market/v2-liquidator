import express from 'express';

const app = express();
const port = process.env.PORT || 2025;

// Endpoint healthcheck
app.get('/healthcheck', (req, res) => {
  res.status(200).send('Server is alive');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});