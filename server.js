const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = 3000;

// The User-Agent string our AI Agent will use
const AI_AGENT_USER_AGENT = 'ScrunchAXP-Agent/1.0';

// The main product route
app.get('/product/1', async (req, res) => {
  const userAgent = req.get('User-Agent');
  console.log(`Request received with User-Agent: ${userAgent}`);

  try {
    // Check if the request is coming from our designated AI agent
    if (userAgent === AI_AGENT_USER_AGENT) {
      console.log('AI Agent detected. Serving structured JSON data.');
      const dataPath = path.join(__dirname, 'product-data.json');
      const jsonData = await fs.readFile(dataPath, 'utf8');
      res.type('application/json').send(jsonData);
    } else {
      // For all other user agents, serve the human-friendly HTML page
      console.log('Human user detected. Serving visual HTML page.');
      res.sendFile(path.join(__dirname, 'index.html'));
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error');
  }
});

// A simple root path to guide users
app.get('/', (req, res) => {
    res.send('Welcome to the Scrunch AXP MVP! Please visit /product/1 to see the demo.');
});


app.listen(port, () => {
  console.log(`Scrunch AXP MVP server running at http://localhost:${port}`);
  console.log('Try accessing /product/1 with a browser.');
  console.log(`Then try with curl: curl -H "User-Agent: ${AI_AGENT_USER_AGENT}" http://localhost:${port}/product/1`);
});
