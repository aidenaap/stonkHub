const path = require('path');
const fs = require('fs').promises;

async function getStockList() {
    try {
        const filePath = path.join(__dirname, '../storage/stonkList.json');
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading stock list:', error);
        return {};
    }
}

async function getLegislatorList() {
    try {
        const filePath = path.join(__dirname, '../storage/legislatorList.json');
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading legislator list:', error);
        return [];
    }
}

module.exports = { getStockList, getLegislatorList };