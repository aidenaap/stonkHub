// backend/services/watchlistService.js
const fs = require('fs').promises;
const path = require('path');

const WATCHLIST_FILE = path.join(__dirname, '../storage/stonkData.json');

async function getWatchlist() {
    try {
        const data = await fs.readFile(WATCHLIST_FILE, 'utf8');
        // console.log("watchlist data in getWatchlist()")
        // console.log(data);
        return JSON.parse(data);
    } catch (error) {
        // File doesn't exist, return empty array
        return [];
    }
}

async function addToWatchlist(ticker) {
  try {
    const watchlist = await getWatchlist();
    console.log("Current watchlist when addingto watchlist:", watchlist);

    const upperTicker = ticker.toUpperCase();
    if (!watchlist[upperTicker]) {
      watchlist[upperTicker] = [];
      console.log("New watchlist after adding:", watchlist);
      await saveWatchlist(watchlist);
    }

    return watchlist;
  } catch (err) {
    console.error("Error in addToWatchlist:", err);
    throw err;
  }
}

async function removeFromWatchlist(ticker) {
  const watchlist = await getWatchlist(); // returns the object from your JSON file
  const upper = ticker.toUpperCase();

  if (watchlist.hasOwnProperty(upper)) {
    delete watchlist[upper]; // remove the key/value pair
  }

  await saveWatchlist(watchlist); // save the updated object back to file
  return watchlist;
}

async function saveWatchlist(watchlist) {
    // Ensure data directory exists
    console.log("Savewatchlist watchlist received: ", watchlist);
    await fs.mkdir(path.dirname(WATCHLIST_FILE), { recursive: true });
    await fs.writeFile(WATCHLIST_FILE, JSON.stringify(watchlist, null, 2));
    console.log("Should've saved the watchlist now.");
}

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };
