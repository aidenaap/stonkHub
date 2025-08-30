// send everything through api
const API_BASE = '/api';

// setup for dynamic filtering
let currentData = [];
let filteredData = [];
let currentDataType = 'lobbying';

// storage for api calls upon startup
let lobbyingData;
let congressData;
let contractData;
let newsData;
let watchlistData;

// headers from api calls to be displayed in title headers. Values formatted baesd on these in 
const lobbyingHeaders = ['Ticker', 'Client', 'Date', 'Amount', 'Issue', 'Specific_Issue', 'Registrant'];
const congressHeaders = ['Representative', 'Ticker', 'Transaction', 'Amount', 'Range', 'TransactionDate', 'ReportDate', 'Party', 'House'];
const contractHeaders = ['Ticker', 'Agency', 'Date', 'Amount', 'Description'];
const newsHeaders = ['Title', 'Description', 'Type', 'URL'];
const watchlistHeaders = ['Ticker', 'Name', 'Valuation', '30d', '6mo'];

// navbar search iteration 
let placeholderIndex = 0;
const placeholders = ["Search tickers...", "Search politicians...", "Search greatness..."];

// Handle the animated placeholder value in the search bar
function animatePlaceholder() {
    const searchInput = document.querySelector('nav input[type="text"]');

    // Fade out
    searchInput.style.transition = 'opacity 0.5s ease-in-out';
    searchInput.style.opacity = '0.3';

    setTimeout(() => {
    // Change placeholder
    placeholderIndex = (placeholderIndex + 1) % placeholders.length;
    searchInput.placeholder = placeholders[placeholderIndex];

    // Fade back in
    searchInput.style.opacity = '1';
    }, 500);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupFilterListener();
    setInterval(animatePlaceholder, 3000); // Change every 3 seconds

    document.getElementById('add-ticker-btn').addEventListener('click', async function() {
        const tickerInput = document.getElementById('ticker-input');
        const ticker = tickerInput.value.trim();
        if (ticker) {
            await addToWatchlist(ticker);
            tickerInput.value = '';
        }
    });


});

function setupFilterListener() {
    const filterInput = document.getElementById('filter-input');
    filterInput.addEventListener('input', function(e) {
    filterData(e.target.value);
    });
}

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

    // Display lobbying upon startup
    currentData=lobbyingData;
    displayTableData(lobbyingData, lobbyingHeaders, true)
    
}


// For each nav-bar button, set active tab, title above table, currentData, and currentDataType
// Meanwhile call displayTableData 
async function loadLobbyingPage() {
    try {
        setActiveTab(document.getElementById('lobbying-btn'));
        document.getElementById('table-title').textContent = 'Lobbying Data';
        toggleWatchlistControls();
        // showLoading();

        // const response = await fetch(`${API_BASE}/lobbying`);
        // const data = await response.json();
        // currentData = lobbyingData;
        currentDataType = 'lobbying';
        // displayTableData(data, lobbyingHeaders);
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
        toggleWatchlistControls();
        // showLoading();

        // const response = await fetch(`${API_BASE}/congress`);
        // const data = await response.json();
        // currentData = data;
        currentDataType = 'congress';
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
        toggleWatchlistControls();
        // showLoading();

        // const response = await fetch(`${API_BASE}/contracts`);
        // const data = await response.json();
        // currentData = data;
        currentDataType = 'contracts';
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
        toggleWatchlistControls();
        // showLoading();

        // const response = await fetch(`${API_BASE}/news`);
        // const data = await response.json();
        // currentData = data;
        currentDataType = 'news';
        // console.log("data right before calling displayTableData:")
        // console.log(data);
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
        toggleWatchlistControls();
        
        // Convert simple ticker array to table-friendly format
        const tableData = watchlist.map(ticker => ({
            Ticker: ticker,
            DateAdded: new Date().toLocaleDateString(), // You'd want to store this
            Notes: 'N/A'
        }));
        
        currentData = tableData;
        currentDataType = 'watchlist';
        displayTableData(tableData, ['Ticker', 'Date Added', 'Notes']);
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
async function addToWatchlist(ticker) {
    try {
        const response = await fetch(`${API_BASE}/watchlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ticker: ticker })
        });
        
        if (response.ok) {
            const updatedWatchlist = await response.json();
            console.log('Added to watchlist:', updatedWatchlist);
            // Optionally reload watchlist view if currently displayed
            if (currentDataType === 'watchlist') {
                loadWatchListPage();
            }
        } else {
            console.error('Failed to add to watchlist');
        }
    } catch (error) {
        console.error('Error adding to watchlist:', error);
    }
}
async function removeFromWatchlist(ticker) {
    try {
        const response = await fetch(`${API_BASE}/watchlist/${ticker}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const updatedWatchlist = await response.json();
            console.log('Removed from watchlist:', updatedWatchlist);
            // Optionally reload watchlist view
            if (currentDataType === 'watchlist') {
                loadWatchListPage();
            }
        }
    } catch (error) {
        console.error('Error removing from watchlist:', error);
    }
}


// Display base information with highlighting - custom buttons on news, delete button on watchlist
function displayTableData(data, headers, firstTime=false) {

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
            if (header === 'Amount' && value) {
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

                console.log(alpha);

                td.appendChild(alpha);
            } else {
                td.textContent = value || 'N/A';
            }

            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });

    // Show table, hide loading on first time load
    if(firstTime = true) {
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

            if (header === 'Amount' && value) {
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

// Loading/error screens
function showLoading() {
document.getElementById('loading').classList.remove('hidden');
document.getElementById('data-table').classList.add('hidden');
}
function showError(message) {
const loading = document.getElementById('loading');
loading.innerHTML = `<div class="text-red-400 text-xl">${message}</div>`;
}