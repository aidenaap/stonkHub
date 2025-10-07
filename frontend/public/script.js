// send everything through api
const API_BASE = '/api';

// setup for dynamic filtering
let currentData = [];
let filteredData = [];
let currentDataType = 'lobbying';

// storage to get info from static json
let stockList = {};
let legislatorList = [];

// storage for api calls upon startup
let lobbyingData;
let congressData;
let contractData;
let newsData;
let watchlistData;
let stockData = {};

// headers from api calls to be displayed in title headers. Values formatted baesd on these in 
const lobbyingHeaders = ['Ticker', 'Client', 'Date', 'Amount', 'Issue', 'Specific_Issue', 'Registrant'];
const congressHeaders = ['Representative', 'Ticker', 'Transaction', 'Amount', 'Range', 'TransactionDate', 'ReportDate', 'Party', 'House'];
const contractHeaders = ['Ticker', 'Agency', 'Date', 'Amount', 'Description'];
const newsHeaders = ['Title', 'Description', 'Type', 'URL', 'AI Review'];
const watchlistHeaders = ['Ticker', 'Current', 'Change', '% Change', 'Open', 'Prev Close', 'Remove'];

// navbar search iteration 
let placeholderIndex = 0;
const placeholders = ["Search tickers...", "Search politicians...", "Search greatness..."];

// Prep filter
function setupFilterListener() {
    const filterInput = document.getElementById('filter-input');
    filterInput.addEventListener('input', function(e) {
    filterData(e.target.value);
    });
}
// Handle the animated placeholder in the search bar
// function animatePlaceholder() {
//     const searchInput = document.querySelector('nav input[type="text"]');

//     // Fade out
//     searchInput.style.transition = 'opacity 0.5s ease-in-out';
//     searchInput.style.opacity = '0.3';

//     setTimeout(() => {
//     // Change placeholder
//     placeholderIndex = (placeholderIndex + 1) % placeholders.length;
//     searchInput.placeholder = placeholders[placeholderIndex];

//     // Fade back in
//     searchInput.style.opacity = '1';
//     }, 500);
// }
function animatePlaceholder() {
    const searchBtn = document.getElementById('search-icon-btn');
    
    searchBtn.style.transition = 'opacity 0.5s ease-in-out';
    searchBtn.style.opacity = '0.3';

    setTimeout(() => {
        searchBtn.style.opacity = '1';
    }, 500);
}


// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupFilterListener();
    setInterval(animatePlaceholder, 3000); // Change every 3 seconds

    // watch for adding tickers
    document.getElementById('add-ticker-btn').addEventListener('click', async function() {
        const tickerInput = document.getElementById('ticker-input');
        const ticker = tickerInput.value.trim();
        if (ticker) {
            const watchlistPushResponse = await fetch(`${API_BASE}/watchlist`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticker: ticker })
            });

            console.log(watchlistPushResponse);
            // await addToWatchlist(ticker);
            tickerInput.value = '';
        }
    });

    // watch for search
    document.getElementById('modal-search-input').addEventListener('input', function(e) {
        fuzzySearch(e.target.value);
    });
});

// Load data on initial load
async function loadInitialData() {

    // show loading until we displayTableData
    showLoading();

    // lobbying
    const lobbyingResponse = await fetch(`${API_BASE}/lobbying`);
    lobbyingData = await lobbyingResponse.json();
    // congress
    const congressResponse = await fetch(`${API_BASE}/congress`);
    congressData = await congressResponse.json();
    // contracts
    const contractResponse = await fetch(`${API_BASE}/contracts`);
    contractData = await contractResponse.json();

    // news
    const newsResponse = await fetch(`${API_BASE}/news`);
    newsData = await newsResponse.json();

    // watchlist
    const watchlistResponse = await fetch(`${API_BASE}/watchlist`);
    watchlistData = await watchlistResponse.json();
    console.log("watchlistData");
    console.log(watchlistData);

    const tickers = Object.keys(watchlistData);


    // stockData based on watchlist
    const stockResponse = await fetch(`${API_BASE}/stocklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stocklist: tickers })
    });


    stockData = await stockResponse.json();
    console.log("Stock Data:");
    console.log(stockData);

    // Display lobbying upon startup
    currentData=lobbyingData;
    displayTableData(lobbyingData, lobbyingHeaders, true);

    // // Obtain static data from JSON after info is obtained
    // const stockListResponse = await fetch(`${API_BASE}/search/stocks`);
    // stockList = await stockListResponse.json();

    // const legislatorListResponse = await fetch(`${API_BASE}/search/legislators`);
    // legislatorList = await legislatorListResponse.json();
}
// Change button styling upon click of nav-bar buttons
function setActiveTab(activeButton) {
    // Remove active class from all buttons
    document.querySelectorAll('nav button').forEach(btn => {
    btn.classList.remove('active-tab', 'bg-[#76ABAE]', 'text-[#222831]');
    btn.classList.add('bg-transparent', 'text-[#EEEEEE]', 'border', 'border-[#76ABAE]/30');
    });

    // Add active class to clicked button
    activeButton.classList.add('active-tab', 'bg-[#76ABAE]', 'text-[#222831]');
    activeButton.classList.remove('bg-transparent', 'text-[#EEEEEE]', 'border', 'border-[#76ABAE]/30');
}

// For each nav-bar button, set active tab, title above table, currentData, and currentDataType
// Meanwhile call displayTableData 
async function loadLobbyingPage() {
    try {
        setActiveTab(document.getElementById('lobbying-btn'));
        document.getElementById('table-title').textContent = 'Lobbying Data';

        currentDataType = 'lobbying';
        toggleWatchlistControls();

        currentData = lobbyingData;
        displayTableData(lobbyingData, lobbyingHeaders);
    } catch (error) {
        console.error('Error loading lobbying data:', error);
        showError('Failed to load lobbying data');
    }
}
async function loadCongressPage() {
    try {
        setActiveTab(document.getElementById('congress-btn'));
        document.getElementById('table-title').textContent = 'Congress Trading Data';
        
        currentDataType = 'congress';
        toggleWatchlistControls();

        currentData = congressData;
        displayTableData(congressData, congressHeaders);
    } catch (error) {
        console.error('Error loading congress data:', error);
        showError('Failed to load congress trading data');
    }
}
async function loadContractsPage() {
    try {
        setActiveTab(document.getElementById('contracts-btn'));
        document.getElementById('table-title').textContent = 'Government Contracts Data';
        
        currentDataType = 'contracts';
        toggleWatchlistControls();

        currentData = contractData;
        displayTableData(contractData, contractHeaders);
    } catch (error) {
        console.error('Error loading contracts data:', error);
        showError('Failed to load government contracts data');
    }
}
async function loadNewsPage() {
    try {
        setActiveTab(document.getElementById('news-btn'));
        document.getElementById('table-title').textContent = 'Top Headlines & Tech News';
        
        currentDataType = 'news';
        toggleWatchlistControls();

        currentData = newsData;
        displayTableData(newsData, newsHeaders);
    } catch (error) {
        console.error('Error loading news', error);
        showError('Failed to load news data');
    }
}
async function loadWatchlistPage() {
    try {
        setActiveTab(document.getElementById('watchlist-btn')); // if you add the button
        document.getElementById('table-title').textContent = 'My Watchlist';
        
        currentDataType = 'watchlist';
        toggleWatchlistControls();

        // going to have to load in watchlist, then stock data, then convert to table-friendly format
        const tableData = Object.entries(watchlistData).map(([ticker, values]) => ({
            "Ticker": ticker,
            "Current": values[0],
            "Change": values[1],
            "% Change": values[2],
            "Open": values[3],
            "Prev Close": values[4]
        }));
        
        currentData = tableData;
        displayTableData(tableData, watchlistHeaders);
    } catch (error) {
        console.error('Error loading watchlist:', error);
        showError('Failed to load watchlist');
    }
}


// Watchlist Functionality
// Custom display of add feature
function toggleWatchlistControls() {
    const watchlistControls = document.getElementById('watchlist-controls');
    if (currentDataType === 'watchlist') {
        watchlistControls.classList.remove('hidden');
        watchlistControls.classList.add('flex');
    } else {
        watchlistControls.classList.add('hidden');
        watchlistControls.classList.remove('flex');
    }
}
// Add and deletion from JSON in backend/storage
// async function addToWatchlist(ticker) {
//     try {
//         const response = await fetch(`${API_BASE}/watchlist`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ ticker: ticker })
//         });
        
//         if (response.ok) {
//             const updatedWatchlist = await response.json();
//             console.log('Added to watchlist:', updatedWatchlist);
//             // Optionally reload watchlist view if currently displayed
//             if (currentDataType === 'watchlist') {
//                 await loadWatchlistPage();
//             }
//         } else {
//             console.error('Failed to add to watchlist');
//         }
//     } catch (error) {
//         console.error('Error adding to watchlist:', error);
//     }
// }
// async function removeFromWatchlist(ticker) {
//     try {
//         const response = await fetch(`${API_BASE}/watchlist/${ticker}`, {
//             method: 'DELETE'
//         });
        
//         if (response.ok) {
//             const updatedWatchlist = await response.json();
//             console.log('Removed from watchlist:', updatedWatchlist);
//             // Optionally reload watchlist view
//             if (currentDataType === 'watchlist') {
//                 loadWatchListPage();
//             }
//         }
//     } catch (error) {
//         console.error('Error removing from watchlist:', error);
//     }
// }


// Helper function to determine if a row should be highlighted
function shouldHighlightRow(item, dataType) {

    if (dataType != 'news') {
        const amount = parseFloat(item.Amount) || 0;

        switch(dataType) {
            case 'lobbying':
                return amount >= 100000;
            case 'congress':
                return amount >= 50001;
            case 'contracts':
                return amount >= 1000000;
            default:
                return false;
        }
    } else {
        return false;
    }
}
// Display base information with highlighting - custom buttons on news, delete button on watchlist
function displayTableData(data, headers, firstTime=false, stockRefresh=false) {

    const table = document.getElementById('data-table');
    const tableHeaders = document.getElementById('table-headers');
    const tableBody = document.getElementById('table-body');
    const loading = document.getElementById('loading');

    // Clear existing content
    tableHeaders.innerHTML = '';
    tableBody.innerHTML = '';

    // Create headers
    headers.forEach(header => {
        const th = document.createElement('th');
        th.className = 'px-4 py-3 text-left text-[#76ABAE] font-semibold border-b border-[#76ABAE]/20';
        th.textContent = header.replace('_', ' ');
        tableHeaders.appendChild(th);
    });

    // Create rows
    data.forEach(item => {
        const tr = document.createElement('tr');

        // Check if row should be highlighted
        const isHighlighted = shouldHighlightRow(item, currentDataType);
        tr.className = isHighlighted 
        ? 'border-b border-[#76ABAE]/10 hover:bg-[#76ABAE]/30 bg-[#76ABAE]/20' 
        : 'border-b border-[#76ABAE]/10 hover:bg-[#222831]/50';

        // Create table data cell for each header iterating through the data
        headers.forEach(header => {
            const td = document.createElement('td');
            td.className = isHighlighted 
                ? 'px-4 py-3 text-[#EEEEEE] font-medium' 
                : 'px-4 py-3 text-[#EEEEEE]';

            // get value from data list based on header (news is lowercase)
            let value = item[header];
            if (currentDataType == 'news') {
                value = item[header.toLowerCase()];
            }

            // Tranform text if amount, date, or URL
            if ((header === 'Amount' || header === 'Current' || header === 'Open' || header === 'Prev Close') && value) {
                value = '$' + Number(value).toLocaleString();
                // Make the amount bold if highlighted
                if (isHighlighted) {
                    td.classList.add('font-bold');
                }
                td.textContent = value || 'N/A';
            } else if (header.includes('Date') && value) {
                value = new Date(value).toLocaleDateString();
                td.textContent = value || 'N/A';
            } else if (header === 'URL') {
                const alpha = document.createElement('a');
                alpha.href = value;
                alpha.textContent = "View Article";
                alpha.target = "_blank";
                alpha.rel = "noopener noreferrer";
                alpha.classList.add('newsArticleBtn');

                td.appendChild(alpha);
            } else if (header === 'AI Review') {
                const alpha = document.createElement('a');
                alpha.textContent = "AI Summary";
                alpha.classList.add('aiReviewBtn');
                // add code to send to openai API and then open a large pop-up on the screen. 
            } else if (header==='Remove') {
                 const alpha = document.createElement('a');
                alpha.href = "#";
                alpha.textContent = "Delete";
                alpha.rel = "noopener noreferrer";
                alpha.classList.add('deleteWatchlistBtn');
                // upon click, delete from the watchlist
                alpha.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const ticker = item.Ticker; // ticker comes from your row data
                    try {
                        const response = await fetch(`${API_BASE}/watchlist/${ticker}`, {
                            method: "DELETE"
                        });
                        if (response.ok) {
                            console.log(`${ticker} deleted successfully`);

                            // Option A: remove row directly
                            tr.remove();

                            // Option B: reload watchlist & table fresh
                            // await loadWatchlistPage();
                        } else {
                            console.error("Failed to delete ticker:", ticker);
                        }
                    } catch (err) {
                        console.error("Error deleting ticker:", err);
                    }
                });

                td.appendChild(alpha)
            } else {
                td.textContent = value || 'N/A';
            }

            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });

    // Show table, hide loading on first time load
    if(firstTime == true || stockRefresh == true) {
        loading.classList.add('hidden');
        table.classList.remove('hidden');
    }  

    filteredData = data;
    document.getElementById('filter-input').value = '';
}

// Filtering functionality
function filterData(searchTerm) {

    if (!searchTerm.trim()) {
        filteredData = currentData;
    } else {
        filteredData = currentData.filter(item => {
            return Object.values(item).some(value => 
                value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }

    let headers;
    switch(currentDataType) {
        case 'lobbying': headers = lobbyingHeaders; break;
        case 'congress': headers = congressHeaders; break;
        case 'contracts': headers = contractHeaders; break;
        case 'news': headers = newsHeaders; break;
        case 'watchlist': headers = watchlistHeaders; break;

    }

    displayFilteredData(filteredData, headers);
}
function displayFilteredData(data, headers) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';

    data.forEach(item => {
        const tr = document.createElement('tr');

        // Check if row should be highlighted
        const isHighlighted = shouldHighlightRow(item, currentDataType);
        tr.className = isHighlighted 
        ? 'border-b border-[#76ABAE]/10 hover:bg-[#76ABAE]/30 bg-[#76ABAE]/20' 
        : 'border-b border-[#76ABAE]/10 hover:bg-[#222831]/50';

        headers.forEach(header => {
            const td = document.createElement('td');
            td.className = isHighlighted 
                ? 'px-4 py-3 text-[#EEEEEE] font-medium' 
                : 'px-4 py-3 text-[#EEEEEE]';

            let value = item[header];

            if (currentDataType == 'news') {
                value = item[header.toLowerCase()];
            }

            if ((header === 'Amount' || header === 'Current' || header === 'Open' || header === 'Prev Close') && value) {
                value = '$' + Number(value).toLocaleString();
                // Make the amount bold if highlighted
                if (isHighlighted) {
                    td.classList.add('font-bold');
                }
            } else if (header.includes('Date') && value) {
                value = new Date(value).toLocaleDateString();
            }

            td.textContent = value || 'N/A';
            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });
}

// Modal Pop-up
async function openSearchModal() {
    const modal = document.getElementById('search-modal');
    modal.style.display = 'flex';
    document.getElementById('modal-search-input').focus();
    
    // Lazy load search data only when modal opens
    if (Object.keys(stockList).length === 0) {
        const stockListResponse = await fetch(`${API_BASE}/search/stocks`);
        stockList = await stockListResponse.json();
    }
    
    if (legislatorList.length === 0) {
        const legislatorListResponse = await fetch(`${API_BASE}/search/legislators`);
        legislatorList = await legislatorListResponse.json();
    }
    
    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeSearchModal();
        }
    });
}

function closeSearchModal() {
    document.getElementById('search-modal').style.display = 'none';
    document.getElementById('search-dropdown').classList.add('hidden');
    document.getElementById('modal-search-input').value = '';
    document.getElementById('search-results').innerHTML = '<div class="text-[#76ABAE]/50 text-center">Search for a stock or politician to view details</div>';
}

// Fuzzy search implementation
function fuzzySearch(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
        document.getElementById('search-dropdown').classList.add('hidden');
        return;
    }
    
    const term = searchTerm.toLowerCase();
    const results = [];
    
    // Search stocks
    Object.values(stockList).forEach(stock => {
        if (stock.Symbol.toLowerCase().includes(term) || 
            stock.Name.toLowerCase().includes(term)) {
            results.push({ type: 'stock', data: stock });
        }
    });
    
    // Search legislators
    legislatorList.forEach(legislator => {
        const fullName = legislator.name.fullname.toLowerCase();
        if (fullName.includes(term)) {
            results.push({ type: 'legislator', data: legislator });
        }
    });
    
    displaySearchDropdown(results.slice(0, 10));
}

function displaySearchDropdown(results) {
    const dropdown = document.getElementById('search-dropdown');
    
    if (results.length === 0) {
        dropdown.classList.add('hidden');
        return;
    }
    
    dropdown.innerHTML = results.map(result => {
        if (result.type === 'stock') {
            return `<div onclick="selectSearchResult('stock', '${result.data.Symbol}')" 
                class="p-3 hover:bg-[#76ABAE]/20 cursor-pointer border-b border-[#76ABAE]/10">
                <div class="font-semibold text-[#76ABAE]">${result.data.Symbol}</div>
                <div class="text-sm text-[#EEEEEE]/70">${result.data.Name}</div>
            </div>`;
        } else {
            return `<div onclick="selectSearchResult('legislator', '${result.data.id.bioguide}')" 
                class="p-3 hover:bg-[#76ABAE]/20 cursor-pointer border-b border-[#76ABAE]/10">
                <div class="font-semibold text-[#76ABAE]">${result.data.name.fullname}</div>
                <div class="text-sm text-[#EEEEEE]/70">${result.data.terms[result.data.terms.length-1].state} - ${result.data.terms[result.data.terms.length-1].party}</div>
            </div>`;
        }
    }).join('');
    
    dropdown.classList.remove('hidden');
}

function selectSearchResult(type, id) {
    document.getElementById('search-dropdown').classList.add('hidden');
    
    if (type === 'stock') {
        displayStockDetails(id);
    } else {
        displayLegislatorDetails(id);
    }
}

function displayStockDetails(symbol) {
    const stock = stockList[symbol];
    document.getElementById('search-results').innerHTML = `
        <div class="space-y-4">
            <h3 class="text-2xl font-bold text-[#76ABAE]">${stock.Symbol} - ${stock.Name}</h3>
            <div class="grid grid-cols-2 gap-4">
                <div><span class="text-[#76ABAE]">Market Cap:</span> $${Number(stock['Market Cap']).toLocaleString()}</div>
                <div><span class="text-[#76ABAE]">Sector:</span> ${stock.Sector}</div>
                <div><span class="text-[#76ABAE]">Industry:</span> ${stock.Industry}</div>
                <div><span class="text-[#76ABAE]">Country:</span> ${stock.Country}</div>
            </div>
        </div>`;
}

function displayLegislatorDetails(bioguideId) {
    const legislator = legislatorList.find(l => l.id.bioguide === bioguideId);
    const latestTerm = legislator.terms[legislator.terms.length - 1];
    
    document.getElementById('search-results').innerHTML = `
        <div class="space-y-4">
            <h3 class="text-2xl font-bold text-[#76ABAE]">${legislator.name.fullname}</h3>
            <div class="grid grid-cols-2 gap-4">
                <div><span class="text-[#76ABAE]">Position:</span> ${latestTerm.type === 'sen' ? 'Senator' : 'Representative'}</div>
                <div><span class="text-[#76ABAE]">State:</span> ${latestTerm.state}</div>
                <div><span class="text-[#76ABAE]">Party:</span> ${latestTerm.party}</div>
                <div><span class="text-[#76ABAE]">Current Term:</span> ${latestTerm.start} to ${latestTerm.end}</div>
            </div>
        </div>`;
}


// Loading/error screens
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('data-table').classList.add('hidden');
}
function showError(message) {
    const loading = document.getElementById('loading');
    loading.innerHTML = `<div class="text-red-400 text-xl">${message}</div>`;
}