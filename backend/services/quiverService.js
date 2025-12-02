// backend/services/quiverService.js
const axios = require('axios');
const QUIVER_API_TOKEN = process.env.QUIVER_API_TOKEN;

// Lobbying Data
const fetchLobbying = async (options = {
   page: 1,
   page_size: 50
}) => {
   try {
       const response = await axios.get('https://api.quiverquant.com/beta/live/lobbying', {
           headers: {
               'Authorization': `Bearer ${QUIVER_API_TOKEN}`,
               'Content-Type': 'application/json'
           },
           params: {
               all: options.all,
               date_from: options.date_from,
               date_to: options.date_to,
               page: options.page,
               page_size: options.page_size || 50
           }
       });
       
    //    console.log('Recent Lobbying Data:');
    //    console.log('====================');
    //    response.data.forEach((lobbying, index) => {
    //        console.log(`\n${index + 1}. ${lobbying.Ticker} - ${lobbying.Client}`);
    //        console.log(`   Date: ${lobbying.Date}`);
    //        console.log(`   Amount: $${lobbying.Amount}`);
    //        console.log(`   Issue: ${lobbying.Issue}`);
    //        console.log(`   Specific Issue: ${lobbying.Specific_Issue}`);
    //        console.log(`   Registrant: ${lobbying.Registrant}`);
    //    });
       console.log("Lobbying data retrieved");
       return response.data;
   } catch (error) {
       if (error.response) {
           console.error(`Error fetching lobbying data: HTTP ${error.response.status} - ${error.response.statusText}`);
       } else {
           console.error('Error fetching lobbying data:', error.message);
       }
       return null;
   }
};
const fetchHistoricalLobbying = async (ticker, options = {
   page: 1,
   page_size: 10
}) => {
   try {
       const response = await axios.get(`https://api.quiverquant.com/beta/historical/lobbying/${ticker}`, {
           headers: {
               'Authorization': `Bearer ${QUIVER_API_TOKEN}`,
               'Content-Type': 'application/json'
           },
           params: {
               page: options.page,
               page_size: options.page_size || 50,
               query: options.query,
               queryTicker: options.queryTicker
           }
       });
       
       return response.data;
   } catch (error) {
       if (error.response) {
           console.error(`Error fetching historical lobbying data: HTTP ${error.response.status} - ${error.response.statusText}`);
       } else {
           console.error('Error fetching historical lobbying data:', error.message);
       }
       return null;
   }
};

// Live Congress Trading Data
const fetchCongressTrading = async (options = {
   page: 1,
   page_size: 50
}) => {
   try {
       const response = await axios.get('https://api.quiverquant.com/beta/live/congresstrading', {
           headers: {
               'Authorization': `Bearer ${QUIVER_API_TOKEN}`,
               'Content-Type': 'application/json'
           },
           params: {
               normalized: options.normalized,
               representative: options.representative,
               page: options.page,
               page_size: options.page_size || 50
           }
       });
       
    //    console.log('Recent Congress Trading Data:');
    //    console.log('============================');
    //    response.data.forEach((trade, index) => {
    //        console.log(`\n${index + 1}. ${trade.Representative} (${trade.Party})`);
    //        console.log(`   Ticker: ${trade.Ticker}`);
    //        console.log(`   Transaction: ${trade.Transaction}`);
    //        console.log(`   Amount: $${trade.Amount?.toLocaleString()}`);
    //        console.log(`   Range: ${trade.Range}`);
    //        console.log(`   Transaction Date: ${trade.TransactionDate}`);
    //        console.log(`   Report Date: ${trade.ReportDate}`);
    //        console.log(`   House: ${trade.House}`);
    //        console.log(`   District: ${trade.District}`);
    //    });
        console.log("Congress trading data retrieved.");
       return response.data;
   } catch (error) {
       if (error.response) {
           console.error(`Error fetching congress trading data: HTTP ${error.response.status} - ${error.response.statusText}`);
       } else {
           console.error('Error fetching congress trading data:', error.message);
       }
       return null;
   }
};
const fetchHistoricalCongressTrading = async (ticker, options = {
   page: 1,
   page_size: 10
}) => {
   try {
       const response = await axios.get(`https://api.quiverquant.com/beta/historical/congresstrading/${ticker}`, {
           headers: {
               'Authorization': `Bearer ${QUIVER_API_TOKEN}`,
               'Content-Type': 'application/json'
           },
           params: {
               analyst: options.analyst,
               page: options.page,
               page_size: options.page_size || 50
           }
       });
       
       return response.data;
   } catch (error) {
       if (error.response) {
           console.error(`Error fetching historical congress trading data: HTTP ${error.response.status} - ${error.response.statusText}`);
       } else {
           console.error('Error fetching historical congress trading data:', error.message);
       }
       return null;
   }
};

// Government Contracts
const fetchGovContracts = async (options = {
   page: 1,
   page_size: 50
}) => {
   try {
       const response = await axios.get('https://api.quiverquant.com/beta/live/govcontractsall', {
           headers: {
               'Authorization': `Bearer ${QUIVER_API_TOKEN}`,
               'Content-Type': 'application/json'
           },
           params: {
               date: options.date,
               page: options.page,
               page_size: options.page_size || 50
           }
       });
       
    //    console.log('Recent Government Contracts:');
    //    console.log('===========================');
    //    response.data.forEach((contract, index) => {
    //        console.log(`\n${index + 1}. ${contract.Ticker} - ${contract.Agency}`);
    //        console.log(`   Date: ${contract.Date}`);
    //        console.log(`   Amount: $${contract.Amount?.toLocaleString()}`);
    //        console.log(`   Description: ${contract.Description}`);
    //    });
       console.log('Government contract data retrieved.');
       return response.data;
   } catch (error) {
       if (error.response) {
           console.error(`Error fetching government contracts data: HTTP ${error.response.status} - ${error.response.statusText}`);
       } else {
           console.error('Error fetching government contracts data:', error.message);
       }
       return null;
   }
};
const fetchHistoricalGovContracts = async (ticker, options = {
   page: 1,
   page_size: 10
}) => {
   try {
       const response = await axios.get(`https://api.quiverquant.com/beta/historical/govcontractsall/${ticker}`, {
           headers: {
               'Authorization': `Bearer ${QUIVER_API_TOKEN}`,
               'Content-Type': 'application/json'
           },
           params: {
               page: options.page,
               page_size: options.page_size || 50
           }
       });
       
       return response.data;
   } catch (error) {
       if (error.response) {
           console.error(`Error fetching historical government contracts data: HTTP ${error.response.status} - ${error.response.statusText}`);
       } else {
           console.error('Error fetching historical government contracts data:', error.message);
       }
       return null;
   }
};


module.exports = {
   fetchLobbying,
   fetchHistoricalLobbying,
   fetchCongressTrading,
   fetchHistoricalCongressTrading,
   fetchGovContracts,
   fetchHistoricalGovContracts
};