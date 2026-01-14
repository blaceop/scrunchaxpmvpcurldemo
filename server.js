const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const config = require('./config.json'); // Load configuration
const GenericScraper = require('./scrapers/generic-scraper');

const app = express();
const port = 3000;

// Configure EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON bodies
app.use(express.json());

// The User-Agent string is now loaded from the config file
const AI_AGENT_USER_AGENT = config.ai_agent_user_agent;

// Function to generate a short, unique request ID
const generateRequestId = () => {
  return crypto.randomBytes(4).toString('hex');
};

// Function to identify site from URL and load corresponding configuration
const getSiteConfig = async (url) => {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();
  
  // Determine site based on hostname
  let siteName = '';
  if (hostname.includes('bilibili.com')) {
    siteName = 'bilibili';
  }
  // Add more sites here as needed
  
  if (!siteName) {
    throw new Error(`Unsupported site: ${hostname}`);
  }
  
  // Load configuration file for the site
  const configPath = path.join(__dirname, 'scrapers', 'configurations', `${siteName}.json`);
  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error(`Error loading configuration for ${siteName}:`, error);
    throw error;
  }
};

// New AXP endpoint
app.get('/axp', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({
      error: 'URL parameter is required',
      message: 'Please provide a URL to scrape in the format /axp?url=...'      
    });
  }
  
  const requestId = generateRequestId();
  const userAgent = req.get('User-Agent') || 'N/A';
  
  try {
    // Identify site and load configuration
    const siteConfig = await getSiteConfig(url);
    
    // Create scraper instance with site configuration
    const scraper = new GenericScraper(siteConfig);
    
    // Perform scraping
    const scrapedData = await scraper.scrape(url);
    
    // Determine the visitor type based on the User-Agent from config
    const isAgent = userAgent === AI_AGENT_USER_AGENT;
    const visitorType = isAgent ? 'AI Agent' : 'Human';
    
    // Structured logging
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId: requestId,
      userAgent: userAgent,
      visitorType: visitorType,
      url: url,
      site: siteConfig.siteName
    };
    console.log(JSON.stringify(logEntry));
    
    if (isAgent) {
      // AI Agent detected. Serve the raw structured JSON data.
      res.type('application/json').send(scrapedData);
    } else {
      // For all other user agents, render a generic template with the scraped data.
      // We'll use the same video template for now, but this could be expanded
      res.render('video', { video: scrapedData });
    }
  } catch (error) {
    console.error(`[${requestId}] Error processing AXP request:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// The main video route, now generalized for any video ID
app.get('/video/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const requestId = generateRequestId();
  const userAgent = req.get('User-Agent') || 'N/A';
  
  // For backward compatibility, we'll continue to support the static data approach
  // but also add support for dynamic scraping
  const dataPath = path.join(__dirname, 'video-data.json');

  try {
    // First, try to read the static data for backward compatibility
    let videoJson;
    let videoData;
    
    try {
      videoJson = await fs.readFile(dataPath, 'utf8');
      videoData = JSON.parse(videoJson);

      // If the requested videoId doesn't match our static "database", 
      // attempt dynamic scraping from bilibili
      if (videoData.id !== videoId) {
        // Attempt dynamic scraping from bilibili
        const bilibiliUrl = `https://www.bilibili.com/video/${videoId}`;
        
        // Identify site and load configuration
        const siteConfig = await getSiteConfig(bilibiliUrl);
        
        // Create scraper instance with site configuration
        const scraper = new GenericScraper(siteConfig);
        
        // Perform scraping
        videoData = await scraper.scrape(bilibiliUrl);
        
        // Convert to JSON for AI agents
        videoJson = JSON.stringify(videoData);
      }
    } catch (staticError) {
      // If static data doesn't exist or fails to load, try dynamic scraping
      const bilibiliUrl = `https://www.bilibili.com/video/${videoId}`;
      
      // Identify site and load configuration
      const siteConfig = await getSiteConfig(bilibiliUrl);
      
      // Create scraper instance with site configuration
      const scraper = new GenericScraper(siteConfig);
      
      // Perform scraping
      videoData = await scraper.scrape(bilibiliUrl);
      
      // Convert to JSON for AI agents
      videoJson = JSON.stringify(videoData);
    }

    // Determine the visitor type based on the User-Agent from config
    const isAgent = userAgent === AI_AGENT_USER_AGENT;
    const visitorType = isAgent ? 'AI Agent' : 'Human';

    // Structured logging
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId: requestId,
      userAgent: userAgent,
      visitorType: visitorType,
      videoId: videoId // Log the requested video ID
    };
    console.log(JSON.stringify(logEntry));

    if (isAgent) {
      // AI Agent detected. Serve the raw structured JSON data.
      res.type('application/json').send(videoJson);
    } else {
      // For all other user agents, render the EJS template with the video data.
      res.render('video', { video: videoData });
    }
  } catch (error) {
    console.error(`[${requestId}] Error processing request:`, error);
    
    // Log error with structured format
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId: requestId,
      userAgent: userAgent,
      visitorType: 'Error',
      videoId: videoId,
      error: error.message
    };
    console.log(JSON.stringify(logEntry));
    
    res.status(500).send('Internal Server Error');
  }
});

// A simple root path to guide users
app.get('/', (req, res) => {
    res.send('Welcome to the Scrunch AXP Bilibili Demo! Please visit /video/<your-bilibili-video-id> to see the demo. (e.g., /video/BV1xx411c7mZ)');
});


app.listen(port, () => {
  console.log(`Scrunch AXP (Bilibili Demo) server running at http://localhost:${port}`);
  console.log('Try accessing /video/<video-id> with a browser (e.g., /video/BV1xx411c7mZ).');
  console.log(`Then try with curl: curl -H "User-Agent: ${AI_AGENT_USER_AGENT}" http://localhost:${port}/video/BV1xx411c7mZ`);
});
