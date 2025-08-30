// backend/services/watchlistService.js
const fs = require('fs').promises;
const path = require('path');

const WATCHLIST_FILE = path.join(__dirname, '../storage/stonkData.json');

async function getWatchlist() {
    try {
        const data = await fs.readFile(WATCHLIST_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // File doesn't exist, return empty array
        return [];
    }
}

async function addToWatchlist(ticker) {
    const watchlist = await getWatchlist();
    if (!watchlist.includes(ticker.toUpperCase())) {
        watchlist.push(ticker.toUpperCase());
        await saveWatchlist(watchlist);
    }
    return watchlist;
}

async function removeFromWatchlist(ticker) {
    const watchlist = await getWatchlist();
    const filtered = watchlist.filter(t => t !== ticker.toUpperCase());
    await saveWatchlist(filtered);
    return filtered;
}

async function saveWatchlist(watchlist) {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(WATCHLIST_FILE), { recursive: true });
    await fs.writeFile(WATCHLIST_FILE, JSON.stringify(watchlist, null, 2));
}

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };