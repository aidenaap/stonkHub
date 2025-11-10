const fs = require('fs').promises;
const path = require('path');

const CACHE_DIR = path.join(__dirname, '../storage');
const METADATA_FILE = path.join(CACHE_DIR, 'cacheMetadata.json');

// Check if data is from today (US/Pacific timezone)
const isFromToday = (timestamp) => {
    if (!timestamp) return false;
    
    const now = new Date();
    const cached = new Date(timestamp);
    
    // Convert to US/Pacific
    const nowPacific = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const cachedPacific = new Date(cached.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    
    return nowPacific.toDateString() === cachedPacific.toDateString();
};

// Add this function after isFromToday()
const isMarketHours = () => {
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    
    const day = pacificTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hours = pacificTime.getHours();
    const minutes = pacificTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // Weekend check
    if (day === 0 || day === 6) {
        return false;
    }
    
    // Market hours: 6:30 AM - 1:00 PM Pacific (9:30 AM - 4:00 PM Eastern)
    const marketOpen = 6 * 60 + 30;  // 6:30 AM
    const marketClose = 13 * 60;      // 1:00 PM
    
    return totalMinutes >= marketOpen && totalMinutes < marketClose;
};

// Check if stock cache is still valid
const isStockCacheValid = (timestamp) => {
    if (!timestamp) return false;
    
    try {
        const now = new Date();
        const cached = new Date(timestamp);
        const diffMinutes = (now - cached) / (1000 * 60);
        
        const inMarketHours = isMarketHours();
        
        if (inMarketHours) {
            // During market hours: cache valid for 10 minutes
            return diffMinutes < 10;
        } else {
            // Outside market hours: cache valid for 1 hour
            return diffMinutes < 60;
        }
    } catch (error) {
        console.error('Error checking stock cache validity:', error);
        return false;
    }
};

// Update the readMetadata function to include stockData
const readMetadata = async () => {
    try {
        const data = await fs.readFile(METADATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('Creating new metadata file');
        const defaultMetadata = {
            lobbying: { lastUpdated: null, cacheFile: 'lobbyingCache.json' },
            congress: { lastUpdated: null, cacheFile: 'congressCache.json' },
            contracts: { lastUpdated: null, cacheFile: 'contractsCache.json' },
            news: { lastUpdated: null, cacheFile: 'newsCache.json' },
            stockData: { lastUpdated: null, cacheFile: 'stonkData.json' }
        };
        
        try {
            await fs.writeFile(METADATA_FILE, JSON.stringify(defaultMetadata, null, 2));
        } catch (writeError) {
            console.error('Error creating metadata file:', writeError);
        }
        
        return defaultMetadata;
    }
};

// Add new function for getting cached stock data
const getCachedStockData = async () => {
    try {
        const metadata = await readMetadata();
        const stockMetadata = metadata.stockData;
        
        if (!stockMetadata) {
            console.log('No stock metadata found');
            return null;
        }
        
        if (!isStockCacheValid(stockMetadata.lastUpdated)) {
            const inMarketHours = isMarketHours();
            const interval = inMarketHours ? '10 minutes' : '1 hour';
            console.log(`Stock cache is stale (${interval} interval${inMarketHours ? ' - market hours' : ' - after hours'})`);
            return null;
        }
        
        const cacheFile = path.join(CACHE_DIR, stockMetadata.cacheFile);
        const data = await fs.readFile(cacheFile, 'utf8');
        const parsedData = JSON.parse(data);
        
        const inMarketHours = isMarketHours();
        console.log(`Using cached stock data from ${stockMetadata.lastUpdated} (${inMarketHours ? 'market hours' : 'after hours'})`);
        return parsedData;
    } catch (error) {
        console.log(`Error reading stock cache:`, error.message);
        return null;
    }
};

// Get current timestamp in ISO format
const getCurrentTimestamp = () => {
    return new Date().toISOString();
};

// Write cache metadata
const writeMetadata = async (metadata) => {
    await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
};

// Get cached data if valid
const getCachedData = async (dataType) => {
    try {
        const metadata = await readMetadata();
        const typeMetadata = metadata[dataType];
        
        if (!typeMetadata || !isFromToday(typeMetadata.lastUpdated)) {
            return null; // Cache is stale or doesn't exist
        }
        
        const cacheFile = path.join(CACHE_DIR, typeMetadata.cacheFile);
        const data = await fs.readFile(cacheFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log(`No valid cache found for ${dataType}`);
        return null;
    }
};

// Save data to cache
const setCachedData = async (dataType, data) => {
    try {
        const metadata = await readMetadata();
        
        // Update metadata
        metadata[dataType].lastUpdated = getCurrentTimestamp();
        await writeMetadata(metadata);
        
        // Save data to cache file
        const cacheFile = path.join(CACHE_DIR, metadata[dataType].cacheFile);
        await fs.writeFile(cacheFile, JSON.stringify(data, null, 2));
        
        console.log(`Cache updated for ${dataType} at ${metadata[dataType].lastUpdated}`);
    } catch (error) {
        console.error(`Error saving cache for ${dataType}:`, error);
    }
};

module.exports = {
    getCachedData,
    setCachedData,
    getCachedStockData,
    isFromToday,
    isMarketHours,
    isStockCacheValid
};