/**
 * Generic Scraper Module
 * A universal scraping module that receives a target URL and site configuration
 * to perform scraping and data extraction based on configuration settings.
 */

const axios = require('axios');
const cheerio = require('cheerio');

class GenericScraper {
  /**
   * Constructor for GenericScraper
   * @param {Object} config - Site-specific configuration for scraping
   */
  constructor(config) {
    this.config = config;
    this.siteName = config.siteName;
    this.domain = config.domain;
    this.selectors = config.selectors || {};
    this.scriptSelectors = config.scriptSelectors || {};
    this.apiEndpoints = config.apiEndpoints || {};
    this.dataMapping = config.dataMapping || {};
    this.convertToSchema = config.convertToSchema || {};
  }

  /**
   * Main scraping method
   * @param {string} url - Target URL to scrape
   * @returns {Promise<Object>} Scraped data transformed to schema format
   */
  async scrape(url) {
    try {
      // Validate URL belongs to configured domain
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes(this.domain)) {
        throw new Error(`URL domain ${urlObj.hostname} does not match configured domain ${this.domain}`);
      }

      // Fetch the page content
      const response = await this.fetchPage(url);
      
      // Extract data based on configuration
      let extractedData = {};
      
      // Try to extract from script tags first (for SPA sites with initial state)
      const scriptData = this.extractFromScripts(response.data);
      if (Object.keys(scriptData).length > 0) {
        extractedData = { ...extractedData, ...scriptData };
      }
      
      // Then extract from DOM elements using selectors
      const domData = this.extractFromDOM(response.data);
      extractedData = { ...extractedData, ...domData };
      
      // Apply data mapping to transform extracted data
      const mappedData = this.applyDataMapping(extractedData);
      
      // Transform to the required schema format
      const schemaData = this.transformToSchema(mappedData);
      
      return schemaData;
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fetch page content from URL
   * @param {string} url - URL to fetch
   * @returns {Promise<Object>} Axios response object
   */
  async fetchPage(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });
      return response;
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP Error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Network Error: Unable to reach ${url}`);
      } else {
        throw new Error(`Request Error: ${error.message}`);
      }
    }
  }

  /**
   * Extract data from script tags using scriptSelectors configuration
   * @param {string} html - HTML content of the page
   * @returns {Object} Extracted data from scripts
   */
  extractFromScripts(html) {
    const extractedData = {};
    
    // Look for script tags containing specific variables
    for (const [key, selector] of Object.entries(this.scriptSelectors)) {
      if (selector.startsWith('window.')) {
        // Handle window variables like __INITIAL_STATE__
        const varName = selector.replace('window.', '');
        
        // Match JavaScript variable assignment patterns
        const regex = new RegExp(`${varName}\\s*=\\s*({[\\s\\S]*?});|${varName}\\s*=\\s*([\\s\\S]*?)(?:;|</script>)`, 'i');
        const match = html.match(regex);
        
        if (match) {
          try {
            // Attempt to parse the matched content as JSON
            let jsContent = match[1] || match[2];
            
            // Clean up the JS content for JSON parsing
            jsContent = this.cleanJavaScriptObject(jsContent);
            if (jsContent) {
              extractedData[key] = JSON.parse(jsContent);
            }
          } catch (e) {
            console.warn(`Could not parse ${varName} as JSON:`, e.message);
          }
        }
      }
    }
    
    return extractedData;
  }

  /**
   * Clean JavaScript object notation to make it valid JSON
   * @param {string} jsStr - JavaScript object as string
   * @returns {string|null} Valid JSON string or null if not possible
   */
  cleanJavaScriptObject(jsStr) {
    if (!jsStr) return null;
    
    // Remove extra whitespace and newlines
    let cleaned = jsStr.trim();
    
    // Try to balance braces and brackets
    try {
      // If already looks like JSON, return as is
      JSON.parse(cleaned);
      return cleaned;
    } catch (e) {
      // If not valid JSON, try to extract the object part
      const objMatch = cleaned.match(/{[\s\S]*}/);
      if (objMatch) {
        return objMatch[0];
      }
    }
    
    return null;
  }

  /**
   * Extract data from DOM elements using selectors configuration
   * @param {string} html - HTML content of the page
   * @returns {Object} Extracted data from DOM
   */
  extractFromDOM(html) {
    const $ = cheerio.load(html);
    const extractedData = {};

    // Recursively extract data based on selectors configuration
    this.processSelectors(this.selectors, $, extractedData);

    return extractedData;
  }

  /**
   * Process selectors recursively to extract data
   * @param {Object} selectors - Selector configuration object
   * @param {Object} $ - Cheerio instance
   * @param {Object} result - Result object to populate
   * @param {string} prefix - Prefix for nested keys
   */
  processSelectors(selectors, $, result, prefix = '') {
    for (const [key, value] of Object.entries(selectors)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string') {
        // Direct selector
        const element = $(value).first();
        if (element.length > 0) {
          // Try to get text content first, then attribute values
          let content = element.text().trim();
          
          // If no text content, try to get value attribute
          if (!content) {
            content = element.val();
          }
          
          // If still no content, try getting href or src attributes
          if (!content) {
            content = element.attr('href') || element.attr('src') || '';
          }
          
          result[fullKey] = content;
        }
      } else if (typeof value === 'object') {
        // Nested selectors
        this.processSelectors(value, $, result, fullKey);
      }
    }
  }

  /**
   * Apply data mapping to transform extracted data
   * @param {Object} extractedData - Raw extracted data
   * @returns {Object} Mapped data
   */
  applyDataMapping(extractedData) {
    const mappedData = {};

    for (const [schemaKey, extractionPattern] of Object.entries(this.dataMapping)) {
      // Handle simple mappings and complex expressions with || (OR)
      const parts = extractionPattern.split('||').map(p => p.trim());
      let value = undefined;

      for (const part of parts) {
        // Handle nested property access like 'owner.name'
        const pathParts = part.split('.');
        let currentValue = extractedData;

        for (const pathPart of pathParts) {
          if (currentValue && typeof currentValue === 'object') {
            currentValue = currentValue[pathPart];
          } else {
            currentValue = undefined;
            break;
          }
        }

        if (currentValue !== undefined) {
          value = currentValue;
          break;
        }
      }

      if (value !== undefined) {
        // Set the value in the mapped data using dot notation
        this.setValueByPath(mappedData, schemaKey, value);
      }
    }

    return mappedData;
  }

  /**
   * Set value in an object using dot notation path
   * @param {Object} obj - Target object
   * @param {string} path - Path in dot notation
   * @param {*} value - Value to set
   */
  setValueByPath(obj, path, value) {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Transform mapped data to the required schema format
   * @param {Object} mappedData - Mapped data
   * @returns {Object} Data in schema format
   */
  transformToSchema(mappedData) {
    const schema = JSON.parse(JSON.stringify(this.convertToSchema)); // Deep clone
    
    // Replace placeholders in schema with actual data
    return this.replacePlaceholders(schema, mappedData);
  }

  /**
   * Replace placeholders in schema with actual data values
   * @param {any} obj - Object to process (could be any type)
   * @param {Object} data - Source data to use for replacements
   * @returns {any} Processed object with placeholders replaced
   */
  replacePlaceholders(obj, data) {
    if (typeof obj === 'string') {
      // Handle placeholder replacement like {{property}}
      const matches = obj.match(/\{\{([^}]+)\}\}/g);
      if (matches) {
        let result = obj;
        for (const match of matches) {
          const prop = match.slice(2, -2); // Remove {{ and }}
          const value = this.getValueByPath(data, prop);
          if (value !== undefined) {
            result = result.replace(match, value);
          }
        }
        return result;
      }
      return obj;
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.replacePlaceholders(item, data));
    } else if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replacePlaceholders(value, data);
      }
      return result;
    }
    return obj;
  }

  /**
   * Get value from an object using dot notation path
   * @param {Object} obj - Source object
   * @param {string} path - Path in dot notation
   * @returns {*} Value at path or undefined
   */
  getValueByPath(obj, path) {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }
}

module.exports = GenericScraper;