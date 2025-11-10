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

// Get current timestamp in ISO format
const getCurrentTimestamp = () => {
    return new Date().toISOString();
};

// Read cache metadata
const readMetadata = async () => {
    try {
        const data = await fs.readFile(METADATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return default structure
        return {
            lobbying: { lastUpdated: null, cacheFile: 'lobbyingCache.json' },
            congress: { lastUpdated: null, cacheFile: 'congressCache.json' },
            contracts: { lastUpdated: null, cacheFile: 'contractsCache.json' },
            news: { lastUpdated: null, cacheFile: 'newsCache.json' }
        };
    }
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
    isFromToday
};