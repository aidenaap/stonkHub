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

// Static Table Headers
const lobbyingHeaders = ['Ticker', 'Client', 'Date', 'Amount', 'Issue', 'Specific_Issue', 'Registrant'];
const congressHeaders = ['Representative', 'Ticker', 'Transaction', 'Amount', 'Range', 'TransactionDate', 'ReportDate', 'Party', 'House'];
const contractHeaders = ['Ticker', 'Agency', 'Date', 'Amount', 'Description'];
const newsHeaders = ['Title', 'Description', 'Type', 'URL', 'AI Review'];
const watchlistHeaders = ['Ticker', 'Current', 'Change', '% Change', 'Open', 'Prev Close', 'Remove'];


// ===== Initial Setup ===== //
function setupFilterListener() {
    const filterInput = document.getElementById('filter-input');
    filterInput.addEventListener('input', function(e) {
        filterData(e.target.value);
    });
}
function animatePlaceholder() { // animation in the search bar
    const searchBtn = document.getElementById('search-icon-btn');
    
    searchBtn.style.transition = 'opacity 0.5s ease-in-out';
    searchBtn.style.opacity = '0.3';

    setTimeout(() => {
        searchBtn.style.opacity = '1';
    }, 500);
}
document.addEventListener('DOMContentLoaded', function() { // Initialize filters/animation on page load, listeners for watchlist updates & searches
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

    // watch for search in modal pop-up
    document.getElementById('modal-search-input').addEventListener('input', function(e) {
        fuzzySearch(e.target.value);
    });
});

async function loadInitialData() { // get all API data on initial load

    // show loading until we displayTableData
    showLoading();

    // get all Quiver data
    const lobbyingResponse = await fetch(`${API_BASE}/lobbying`);
    lobbyingData = await lobbyingResponse.json();
    const congressResponse = await fetch(`${API_BASE}/congress`);
    congressData = await congressResponse.json();
    const contractResponse = await fetch(`${API_BASE}/contracts`);
    contractData = await contractResponse.json();

    // news data
    const newsResponse = await fetch(`${API_BASE}/news`);
    newsData = await newsResponse.json();

    // watchlist data
    const watchlistResponse = await fetch(`${API_BASE}/watchlist`);
    watchlistData = await watchlistResponse.json();
    const tickers = Object.keys(watchlistData);

    // live stockData based on watchlist
    const stockResponse = await fetch(`${API_BASE}/stocklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stocklist: tickers })
    });
    stockData = await stockResponse.json();

    // Populate the top ticker bar
    populateTickerBar();

    // Display lobbying upon startup
    currentData=lobbyingData;
    displayTableData(lobbyingData, lobbyingHeaders, true);
}

// ===== Ticker Bar ===== //
function populateTickerBar() {
    const tickerTrack = document.getElementById('ticker-track');
    
    if (!watchlistData || Object.keys(watchlistData).length === 0) {
        tickerTrack.innerHTML = '<div class="ticker-item" style="margin: 0 auto;"><p style="color: #EEEEEE80;">No stocks in watchlist</p></div>';
        return;
    }
    
    let tickerHTML = '';
    
    // Create ticker items from watchlist data
    for (let ticker in watchlistData) {
        const data = watchlistData[ticker];
        const price = data[0];
        if (!price) {
            continue;
        }
        const change = data[1];
        const percentChange = data[2];
        
        const changeClass = change >= 0 ? 'pos-change' : 'neg-change';
        const arrow = change >= 0 ? '▲' : '▼';
        
        tickerHTML += `
            <div class="ticker-item">
                <div class="ticker-left">
                    <p class="ticker-name">${ticker}</p>
                    <p class="ticker-percent-change ${changeClass}">${arrow} ${Math.abs(percentChange).toFixed(2)}%</p>
                </div>
                <p class="ticker-price">$${price.toFixed(2)}</p>
            </div>
        `;
    }
    
    // Duplicate content multiple times for seamless continuous loop
    tickerTrack.innerHTML = tickerHTML + tickerHTML + tickerHTML;
}

// ===== Dynamic Page Changes ===== //
function setActiveTab(activeButton) { // button styling
    // Remove active class from all buttons
    document.querySelectorAll('nav button').forEach(btn => {
    btn.classList.remove('active-tab', 'bg-[#76ABAE]', 'text-[#222831]');
    btn.classList.add('bg-transparent', 'text-[#EEEEEE]', 'border', 'border-[#76ABAE]/30');
    });

    // Add active class to clicked button
    activeButton.classList.add('active-tab', 'bg-[#76ABAE]', 'text-[#222831]');
    activeButton.classList.remove('bg-transparent', 'text-[#EEEEEE]', 'border', 'border-[#76ABAE]/30');
}
function toggleWatchlistControls() { // Watchlist add button
    const watchlistControls = document.getElementById('watchlist-controls');
    if (currentDataType === 'watchlist') {
        watchlistControls.classList.remove('hidden');
        watchlistControls.classList.add('flex');
    } else {
        watchlistControls.classList.add('hidden');
        watchlistControls.classList.remove('flex');
    }
}
// For each, set active tab, title above table, currentData, and currentDataType
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


// ===== Page Display ===== //
function shouldHighlightRow(item, dataType) { // determine if a row should be highlighted

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
function displayTableData(data, headers, firstTime=false, stockRefresh=false) { // primary display

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
            } else if (header === 'URL') {  // Article URL Button
                // const alpha = document.createElement('a');
                // alpha.href = value;
                // alpha.textContent = "View";
                // alpha.target = "_blank";
                // alpha.rel = "noopener noreferrer";
                // alpha.classList.add('newsArticleBtn');

                // td.appendChild(alpha);
                const alpha = document.createElement('a');
                alpha.href = value;
                alpha.target = "_blank";
                alpha.rel = "noopener noreferrer";
                alpha.classList.add('newsArticleBtn');
                alpha.style.display = 'inline-block';
                
                const icon = document.createElement('img');
                icon.src = '/images/eye_svg.svg';
                icon.alt = 'View Article';
                icon.style.width = '24px';
                icon.style.height = '24px';
                icon.style.filter = 'brightness(0) saturate(100%) invert(64%) sepia(23%) saturate(612%) hue-rotate(138deg) brightness(91%) contrast(86%)';
                icon.style.transition = 'filter 0.2s';
                
                alpha.addEventListener('mouseenter', () => {
                    icon.style.filter = 'brightness(0) saturate(100%) invert(64%) sepia(23%) saturate(612%) hue-rotate(138deg) brightness(91%) contrast(86%) opacity(80%)';
                });
                alpha.addEventListener('mouseleave', () => {
                    icon.style.filter = 'brightness(0) saturate(100%) invert(64%) sepia(23%) saturate(612%) hue-rotate(138deg) brightness(91%) contrast(86%)';
                });
                
                alpha.appendChild(icon);
                td.appendChild(alpha);
            } else if (header === 'AI Review') {    // AI Summary Button
                const alpha = document.createElement('a');
                alpha.href = "#";
                alpha.textContent = "Summarize";
                alpha.classList.add('aiReviewBtn');
                alpha.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await openAIModal(item.url, item.title, item.description);
                });
                td.appendChild(alpha); 
            } else if (header==='Remove') {
                const alpha = document.createElement('a');
                alpha.href = "#";
                alpha.rel = "noopener noreferrer";
                alpha.classList.add('deleteWatchlistBtn');
                alpha.style.display = 'inline-block';
                alpha.style.cursor = 'pointer';
                
                const icon = document.createElement('img');
                icon.src = '/images/delete_svg.svg';
                icon.alt = 'Delete';
                icon.style.width = '24px';
                icon.style.height = '24px';
                icon.style.transition = 'opacity 0.2s';
                
                alpha.addEventListener('mouseenter', () => {
                    icon.style.opacity = '0.7';
                });
                alpha.addEventListener('mouseleave', () => {
                    icon.style.opacity = '1';
                });
                
                // upon click, delete from the watchlist
                alpha.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const ticker = item.Ticker;
                    try {
                        const response = await fetch(`${API_BASE}/watchlist/${ticker}`, {
                            method: "DELETE"
                        });
                        if (response.ok) {
                            console.log(`${ticker} deleted successfully`);
                            tr.remove();
                        } else {
                            console.error("Failed to delete ticker:", ticker);
                        }
                    } catch (err) {
                        console.error("Error deleting ticker:", err);
                    }
                });
                
                alpha.appendChild(icon);
                td.appendChild(alpha);
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


// ===== Search Modal Pop-up ===== //
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
function selectSearchResult(type, id) { //open details based on result type/id
    document.getElementById('search-dropdown').classList.add('hidden');
    
    if (type === 'stock') {
        displayStockDetails(id);
    } else {
        displayLegislatorDetails(id);
    }
}
// Pop-up types
function displayStockDetails(symbol) { // stocks pop-up
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
function displayLegislatorDetails(bioguideId) { // legislator pop-up
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

// ===== AI Summary Modal ===== //
async function openAIModal(url, title, description) {
    const modal = document.getElementById('ai-modal');
    modal.style.display = 'flex';
    
    // Set article info
    document.getElementById('ai-modal-title').textContent = title;
    document.getElementById('ai-modal-description').textContent = description;
    document.getElementById('ai-modal-link').href = url;
    
    // Show loading state
    document.getElementById('ai-summary-content').innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="text-[#76ABAE] text-xl">Generating AI summary...</div>
        </div>
    `;
    
    try {
        // Fetch AI summary
        const response = await fetch(`${API_BASE}/news/summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, title, description })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate summary');
        }
        
        const data = await response.json();
        
        // Display summary
        document.getElementById('ai-summary-content').innerHTML = `
            <div class="prose prose-invert max-w-none">
                <div class="text-lg leading-relaxed whitespace-pre-line">${data.summary}</div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error fetching AI summary:', error);
        document.getElementById('ai-summary-content').innerHTML = `
            <div class="text-red-400 text-center">
                <p class="text-xl mb-2">Failed to generate AI summary</p>
                <p class="text-sm">Please try again later</p>
            </div>
        `;
    }
    
    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAIModal();
        }
    });
}
function closeAIModal() {
    document.getElementById('ai-modal').style.display = 'none';
}


// ===== Loading / Error ===== //
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('data-table').classList.add('hidden');
}
function showError(message) {
    const loading = document.getElementById('loading');
    loading.innerHTML = `<div class="text-red-400 text-xl">${message}</div>`;
}