// send everything through api
const API_BASE = '/api';

// setup for dynamic filtering
let currentData = [];
let filteredData = [];
let currentDataType = 'home';

// storage to get info from static json
let stockList = {};
let legislatorList = [];

// storage for api calls upon startup
let homepageData;
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

    // watch for search in modal pop-up
    document.getElementById('modal-search-input').addEventListener('input', function(e) {
        fuzzySearch(e.target.value);
    });
});

async function loadInitialData() { // get all API data on initial load

    // show loading until we displayHomePage
    showLoading();

    // get all Quiver data
    const lobbyingResponse = await fetch(`${API_BASE}/lobbying`);
    lobbyingData = await lobbyingResponse.json();
    const congressResponse = await fetch(`${API_BASE}/congress`);
    congressData = await congressResponse.json();
    const contractResponse = await fetch(`${API_BASE}/contracts`);
    contractData = await contractResponse.json();

    // Generate homepage data
    const homepageResponse = await fetch(`${API_BASE}/homepage`);
    homepageData = await homepageResponse.json();
    console.log('Homepage data loaded:', homepageData);

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
    currentDataType='home';
    toggleHomePage(); // Changed from displayHomePage()
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
// Homepage
async function loadHomePage() {
    try {
        setActiveTab(document.getElementById('home-btn'));
        currentDataType = 'home';
        
        toggleHomePage();
    } catch (error) {
        console.error('Error loading homepage:', error);
        showError('Failed to load homepage');
    }
}

// For each, set active tab, title above table, currentData, and currentDataType
// Meanwhile call displayTableData 
async function loadLobbyingPage() {
    try {
        currentDataType = 'lobbying';
        currentData = lobbyingData;

        toggleHomePage();

        setActiveTab(document.getElementById('lobbying-btn'));
        document.getElementById('table-title').textContent = 'Lobbying Data';

        displayTableData(lobbyingData, lobbyingHeaders, true);
    } catch (error) {
        console.error('Error loading lobbying data:', error);
        showError('Failed to load lobbying data');
    }
}
async function loadCongressPage() {
    try {
        currentDataType = 'congress';
        currentData = congressData;

        toggleHomePage();

        setActiveTab(document.getElementById('congress-btn'));
        document.getElementById('table-title').textContent = 'Congress Trading Data';
        
        displayTableData(congressData, congressHeaders, true);
    } catch (error) {
        console.error('Error loading congress data:', error);
        showError('Failed to load congress trading data');
    }
}
async function loadContractsPage() {
    try {
        currentDataType = 'contracts';
        currentData = contractData;

        toggleHomePage();

        setActiveTab(document.getElementById('contracts-btn'));
        document.getElementById('table-title').textContent = 'Government Contracts Data';
        
        displayTableData(contractData, contractHeaders, true);
    } catch (error) {
        console.error('Error loading contracts data:', error);
        showError('Failed to load government contracts data');
    }
}
async function loadNewsPage() {
    try {
        currentDataType = 'news';
        currentData = newsData;

        toggleHomePage();

        setActiveTab(document.getElementById('news-btn'));
        document.getElementById('table-title').textContent = 'Top Business & Tech News Today';
        
        displayTableData(newsData, newsHeaders, true);
    } catch (error) {
        console.error('Error loading news', error);
        showError('Failed to load news data');
    }
}
// Watchlist functionality
async function loadWatchlistPage() {
    try {
        currentDataType = 'watchlist';
        
        toggleHomePage();
        
        setActiveTab(document.getElementById('watchlist-btn'));
        document.getElementById('table-title').textContent = 'My Watchlist';
        
        // Show loading while we fetch data
        showLoading();

        // Get current watchlist
        const watchlistResponse = await fetch(`${API_BASE}/watchlist`);
        watchlistData = await watchlistResponse.json();
        
        // Check if watchlist is empty
        if (!watchlistData || Object.keys(watchlistData).length === 0) {
            document.getElementById('loading').innerHTML = `
                <div class="text-center">
                    <div class="text-[#76ABAE] text-xl mb-4">Your watchlist is empty</div>
                    <div class="text-[#EEEEEE]/70">Add stocks using the search button to get started</div>
                </div>
            `;
            document.getElementById('data-table').classList.add('hidden');
            return;
        }

        const tickers = Object.keys(watchlistData);
        
        // Check if any ticker has missing/invalid data
        const invalidTickers = tickers.filter(ticker => {
            const data = watchlistData[ticker];
            return !data || data.length === 0 || data[0] === null || data[0] === undefined;
        });

        // If there are invalid tickers, fetch fresh data for them
        if (invalidTickers.length > 0) {
            console.log('Fetching fresh stock data for:', invalidTickers);
            
            try {
                const stockResponse = await fetch(`${API_BASE}/stocklist`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ stocklist: invalidTickers })
                });
                
                if (stockResponse.ok) {
                    const freshStockData = await stockResponse.json();
                    
                    // Update watchlistData with fresh data
                    invalidTickers.forEach(ticker => {
                        if (freshStockData[ticker]) {
                            watchlistData[ticker] = freshStockData[ticker];
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching stock data for invalid tickers:', error);
            }
        }

        // Convert watchlist data to table-friendly format, filtering out any still-invalid entries
        const tableData = Object.entries(watchlistData)
            .filter(([ticker, values]) => values && values.length > 0 && values[0] !== null && values[0] !== undefined)
            .map(([ticker, values]) => ({
                "Ticker": ticker,
                "Current": values[0],
                "Change": parseFloat(values[1].toFixed(2)),
                "% Change": parseFloat(values[2].toFixed(2)),
                "Open": values[3],
                "Prev Close": values[4]
            }));
        
        if (tableData.length === 0) {
            document.getElementById('loading').innerHTML = `
                <div class="text-center">
                    <div class="text-[#76ABAE] text-xl mb-4">Unable to load stock data</div>
                    <div class="text-[#EEEEEE]/70">Please check your watchlist and try again</div>
                </div>
            `;
            document.getElementById('data-table').classList.add('hidden');
            return;
        }

        currentData = tableData;
        displayTableData(tableData, watchlistHeaders, false, true);
        
        // Update ticker bar with current data
        populateTickerBar();
        
    } catch (error) {
        console.error('Error loading watchlist:', error);
        document.getElementById('loading').innerHTML = `
            <div class="text-center">
                <div class="text-red-400 text-xl mb-4">Failed to load watchlist</div>
                <div class="text-[#EEEEEE]/70">${error.message}</div>
            </div>
        `;
        document.getElementById('data-table').classList.add('hidden');
    }
}
async function toggleWatchlist(ticker) {
    const isInWatchlist = watchlistData && watchlistData.hasOwnProperty(ticker);
    
    try {
        if (isInWatchlist) {
            // Remove from watchlist
            const response = await fetch(`${API_BASE}/watchlist/${ticker}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                const updatedWatchlist = await response.json();
                watchlistData = updatedWatchlist;
                console.log(`${ticker} removed from watchlist`);
                
                // Update ticker bar
                populateTickerBar();
                
                // Refresh the display
                await displayStockDetails(ticker);
                
                // If on watchlist page, reload it
                if (currentDataType === 'watchlist') {
                    await loadWatchlistPage();
                }
            } else {
                console.error('Failed to remove from watchlist');
            }
        } else {
            // Add to watchlist
            console.log(`Adding ${ticker} to watchlist...`);
            const response = await fetch(`${API_BASE}/watchlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker: ticker })
            });
            
            if (response.ok) {
                const updatedWatchlist = await response.json();
                watchlistData = updatedWatchlist;
                console.log(`${ticker} added to watchlist`);
                
                // Update ticker bar
                populateTickerBar();
                
                // Simply update the button state without refreshing all details
                const button = document.getElementById('watchlist-toggle-btn');
                if (button) {
                    button.className = 'w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors';
                    button.textContent = 'Remove from Watchlist';
                }
            } else {
                const errorData = await response.json();
                console.error('Failed to add to watchlist:', errorData);
                alert('Failed to add to watchlist. Please try again.');
            }
        }
    } catch (error) {
        console.error('Error toggling watchlist:', error);
        alert('An error occurred. Please try again.');
    }
}
// Data display
function shouldHighlightRow(item, dataType) { // determine if a row should be highlighted

    if (dataType != 'news') {
        const amount = parseFloat(item.Amount) || 0;

        switch(dataType) {
            case 'lobbying':
                return amount >= 300000;
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
        th.className = 'px-4 py-3 text-left text-[#76ABAE] font-semibold border-b border-[#76ABAE]/20 z-50';
        th.textContent = header.replace('_', ' ');
        tableHeaders.appendChild(th);
    });

    // Create rows
    data.forEach(item => {
        const tr = document.createElement('tr');

        // Check if row should be highlighted
        const isHighlighted = shouldHighlightRow(item, currentDataType);
        tr.className = isHighlighted 
        ? 'border-b border-[#76ABAE]/10 hover:bg-[#76ABAE]/30 bg-[#76ABAE]/20 isHighlightedRow' 
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

            // Tranform text if amount, date, review, URL, tickers, or representatives
            if ((header === 'Amount' || header === 'Current' || header === 'Open' || header === 'Prev Close') && value) {
                value = '$' + Number(value).toLocaleString();
                // Make the amount bold if highlighted
                if (isHighlighted) {
                    td.classList.add('font-bold');
                }
                td.textContent = value || 'N/A';
            } else if (header.includes('Date') && value) {
                // Parse as UTC to avoid timezone shifting
                const date = new Date(value + 'T00:00:00Z');
                value = date.toLocaleDateString('en-US', { 
                    timeZone: 'UTC',
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                });
                td.textContent = value || 'N/A';
            } else if (header.includes('Change') && value) {
                if (value > 0) {
                    td.classList.add('pos-change');
                } else {
                    td.classList.add('neg-change');
                }
                td.textContent = value || 'N/A';
            } else if (header === 'URL') {  // Article URL Button
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
            } else if (header === 'Remove') {
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
            } else if (header === 'Ticker' && value) {
                td.style.cursor = 'pointer';
                td.style.color = isHighlighted ? '#ffffff': '#76ABAE';
                td.style.textDecoration = 'underline';
                td.textContent = value;
                td.addEventListener('click', () => {
                    openSearchModal();
                    // Small delay to ensure modal is open and data is loaded
                    setTimeout(() => {
                        displayStockDetails(value);
                    }, 100);
                });
            } else if (header === 'Representative' && value) {
                td.style.cursor = 'pointer';
                td.style.color = isHighlighted ? '#ffffff': '#76ABAE';
                td.style.textDecoration = 'underline';
                td.textContent = value;
                td.addEventListener('click', async () => {
                    openSearchModal();
                    // Small delay to ensure modal is open and data is loaded
                    setTimeout(() => {
                        // Find legislator by name
                        const legislator = legislatorList.find(l => 
                            l.name.fullname.toLowerCase() === value.toLowerCase()
                        );
                        if (legislator) {
                            displayLegislatorDetails(legislator.id.bioguide);
                        } else {
                            document.getElementById('search-results').innerHTML = 
                                '<div class="text-[#76ABAE]/50 text-center">Legislator not found</div>';
                        }
                    }, 100);
                });
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
function toggleHomePage() {
    console.log("Current Data Type inside of toggleHomePage function")
    console.log(currentDataType);
    if (currentDataType !== 'home') {
        console.log("Should be restoring table structure");
        restoreTableStructure();
        return; // Exit early - don't modify DOM if not on home page
    }
    
    const mainContent = document.querySelector('.flex-1.p-6.overflow-hidden > .bg-\\[\\#31363F\\]');
    
    if (!homepageData) {
        mainContent.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-[#76ABAE] text-xl">Loading homepage data...</div>
            </div>
        `;
        return;
    }

    const { greedFearIndex, noticeableTrades, frequentTrades, multipleIndicators } = homepageData;
    
    // Sort noticeably large trades by date (most recent first)
    const sortedNoticeableTrades = [...noticeableTrades].sort((a, b) => 
        new Date(b.TransactionDate) - new Date(a.TransactionDate)
    );
    
    // Calculate greed/fear color
    const getIndexColor = (index) => {
        if (index <= 3) return '#f87171'; // Red (fear)
        if (index <= 7) return '#fbbf24'; // Yellow (neutral)
        return '#4ade80'; // Green (greed)
    };
    
    mainContent.innerHTML = `
        <div class="bg-[#31363F] rounded-lg shadow-lg h-full overflow-auto p-6">
            <h1 class="text-3xl font-bold text-[#76ABAE] mb-6">Market Intelligence Dashboard</h1>
            
            <!-- Top Stats Row - 4 Columns -->
            <div class="flex justify-between gap-6" style="margin-bottom: 10px;">
                <!-- Greed/Fear Index -->
                <div class="bg-[#222831] rounded-lg p-6">
                    <h2 class="text-lg font-semibold text-[#76ABAE] mb-3">Greed/Fear Index</h2>

                    <div class="text-center">

                        <!-- TOP ROW: number, emoji, label -->
                        <div class="flex items-center justify-between gap-6 mb-4">

                            <!-- Number -->
                            <div class="text-5xl font-bold" style="color: ${getIndexColor(greedFearIndex.index)}">
                                ${greedFearIndex.index}/10
                            </div>

                            <!-- Emoji -->
                            <div class="text-3xl">
                                ${greedFearIndex.index <= 3 ? '🐻' : 
                                greedFearIndex.index <= 4 ? '😰' :
                                greedFearIndex.index <= 6 ? '😐' :
                                greedFearIndex.index <= 8 ? '😊' : '🚀'}
                            </div>

                            <!-- Label -->
                            <div class="text-sm text-[#EEEEEE]/70">
                                ${greedFearIndex.index <= 3 ? 'Extreme Fear' : 
                                greedFearIndex.index <= 4 ? 'Fear' :
                                greedFearIndex.index <= 6 ? 'Neutral' :
                                greedFearIndex.index <= 8 ? 'Greed' : 'Extreme Greed'}
                            </div>
                        </div>

                        <!-- BOTTOM ROW: purchases / sales -->
                        <div class="flex items-center justify-between mt-2 text-xs text-[#EEEEEE]/50">
                            <div class="text-[#4ade80] font-semibold">${greedFearIndex.purchaseCount} purchases/</div>
                            <div class="text-[#f87171] font-semibold">${greedFearIndex.saleCount} sales</div>
                        </div>

                    </div>
                </div>
                
                <!-- Large Trades -->
                <div class="bg-[#222831] rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-[#76ABAE] mb-3">Large Trades</h3>
                    <div class="text-center">
                        <div class="text-5xl font-bold text-[#EEEEEE] mb-2">${sortedNoticeableTrades.length}</div>
                        <div class="text-sm text-[#EEEEEE]/70">Trades ≥ $50,001</div>
                    </div>
                </div>
                
                <!-- Frequent Trades -->
                <div class="bg-[#222831] rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-[#76ABAE] mb-3">Frequent Trades</h3>
                    <div class="text-center">
                        <div class="text-5xl font-bold text-[#EEEEEE] mb-2">${frequentTrades.length}</div>
                        <div class="text-sm text-[#EEEEEE]/70">Stocks traded 3+ times</div>
                    </div>
                </div>
                
                <!-- Hot Stocks -->
                <div class="bg-[#222831] rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-[#76ABAE] mb-3">Hot Stocks</h3>
                    <div class="text-center">
                        <div class="text-5xl font-bold text-[#EEEEEE] mb-2">${multipleIndicators.length}</div>
                        <div class="text-sm text-[#EEEEEE]/70">10+ combined indicators</div>
                    </div>
                </div>
            </div>

            <!-- Large Trades Section -->
            <div style="margin-bottom: 10px;">
                <h3 class="text-xl font-semibold text-[#76ABAE]" style="margin-bottom: 5px;">Large Trades (Recent First)</h3>
                <div class="bg-[#222831] rounded-lg p-6">
                    <div class="overflow-auto" style="max-height: 500px;">
                        ${sortedNoticeableTrades.length === 0 ? 
                            '<div class="text-[#EEEEEE]/50 text-center py-4">No large trades found</div>' :
                            sortedNoticeableTrades.map(trade => `
                                <div class="border-b border-[#76ABAE]/10 py-3 last:border-0 hover:bg-[#76ABAE]/10 cursor-pointer transition-colors" onclick="openStockFromHomepage('${trade.Ticker}')">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <div class="font-semibold text-[#76ABAE] text-lg">${trade.Ticker}</div>
                                            <div class="text-sm text-[#EEEEEE]/70 mt-1">${trade.Representative}</div>
                                            <div class="text-xs text-[#EEEEEE]/50 mt-1">
                                                ${new Date(trade.TransactionDate + 'T00:00:00Z').toLocaleDateString('en-US', { 
                                                    timeZone: 'UTC',
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <div class="font-bold text-[#EEEEEE] text-lg">$${Number(trade.Amount).toLocaleString()}</div>
                                            <div class="text-sm ${trade.Transaction.toLowerCase().includes('purchase') || trade.Transaction.toLowerCase().includes('buy') ? 'text-[#4ade80]' : 'text-[#f87171]'} mt-1">
                                                ${trade.Transaction}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>

            <!-- Frequent Trades Section -->
            <div style="margin-bottom: 10px;">
                <h3 class="text-xl font-semibold text-[#76ABAE]" style="margin-bottom: 5px;">Most Frequently Traded Stocks</h3>
                <div class="bg-[#222831] rounded-lg p-6">
                    <div class="overflow-auto" style="max-height: 500px;">
                        ${frequentTrades.length === 0 ? 
                            '<div class="text-[#EEEEEE]/50 text-center py-4">No frequent trades found</div>' :
                            frequentTrades.map(item => `
                                <div class="border-b border-[#76ABAE]/10 py-3 last:border-0 hover:bg-[#76ABAE]/10 cursor-pointer transition-colors" onclick="openStockFromHomepage('${item.ticker}')">
                                    <div class="flex justify-between items-center">
                                        <div>
                                            <div class="font-semibold text-[#76ABAE] text-lg">${item.ticker}</div>
                                            <div class="text-sm text-[#EEEEEE]/70 mt-1">
                                                ${item.count} trades in past 6 months
                                            </div>
                                        </div>
                                        <div class="text-3xl font-bold text-[#EEEEEE]">${item.count}</div>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>

            <!-- Multiple Indicators Section -->
            <div>
                <h3 class="text-xl font-semibold text-[#76ABAE]" style="margin-bottom: 5px;">Stocks with Multiple Indicators</h3>
                <div class="bg-[#222831] rounded-lg p-6">
                    <div class="overflow-auto" style="max-height: 500px;">
                        ${multipleIndicators.length === 0 ? 
                            '<div class="text-[#EEEEEE]/50 text-center py-4">No stocks with multiple indicators</div>' :
                            multipleIndicators.map(item => `
                                <div class="border-b border-[#76ABAE]/10 py-3 last:border-0 hover:bg-[#76ABAE]/10 cursor-pointer transition-colors" onclick="openStockFromHomepage('${item.ticker}')">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <div class="font-semibold text-[#76ABAE] text-lg">${item.ticker}</div>
                                            <div class="text-sm text-[#EEEEEE]/70 mt-1">
                                                <span class="text-[#4ade80]">${item.congressCount} congress</span> · 
                                                <span class="text-[#fbbf24]">${item.lobbyingCount} lobbying</span> · 
                                                <span class="text-[#60a5fa]">${item.contractCount} contracts</span>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-3xl font-bold text-[#EEEEEE]">${item.totalCount}</div>
                                            <div class="text-xs text-[#EEEEEE]/50">total activities</div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}
// restore table structure when toggling from homepage
function restoreTableStructure() {
    const mainContent = document.querySelector('.flex-1.p-6.overflow-hidden');
    mainContent.innerHTML = `
        <div class="bg-[#31363F] rounded-lg shadow-lg h-full flex flex-col">
            <div class="p-4 border-b border-[#76ABAE]/20">
                <div id="table-header-row" class="flex justify-between items-center">
                    <h2 id="table-title" class="text-2xl font-bold text-[#76ABAE]">Data</h2>
                    <div class="flex items-center space-x-4">
                        <input type="text" id="filter-input" placeholder="Filter data..." class="bg-[#222831] text-[#EEEEEE] px-4 py-2 rounded-lg border border-[#76ABAE]/30 focus:border-[#76ABAE] focus:outline-none w-64">
                    </div>
                </div>
            </div>

            <div class="flex-1 overflow-auto">
                <div id="loading" class="flex items-center justify-center h-full">
                    <div class="text-[#76ABAE] text-xl">Loading data...</div>
                </div>
                <table id="data-table" class="w-full hidden">
                    <thead class="bg-[#222831] sticky top-0">
                        <tr id="table-headers"></tr>
                    </thead>
                    <tbody id="table-body"></tbody>
                </table>
            </div>
        </div>
    `;
    
    // Re-setup filter listener
    setupFilterListener();
}
function openStockFromHomepage(ticker) {
    openSearchModal();
    setTimeout(() => {
        displayStockDetails(ticker);
    }, 100);
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
                td.textContent = value || 'N/A';
            } else if (header.includes('Date') && value) {
                // Parse as UTC to avoid timezone shifting
                const date = new Date(value + 'T00:00:00Z');
                value = date.toLocaleDateString('en-US', { 
                    timeZone: 'UTC',
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                });
                td.textContent = value || 'N/A';
            } else if (header === 'URL') {  // Article URL Button
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
            } else if (header === 'Ticker' && value) {
                td.style.cursor = 'pointer';
                td.style.color = isHighlighted ? '#ffffff': '#76ABAE';
                td.style.textDecoration = 'underline';
                td.textContent = value;
                td.addEventListener('click', () => {
                    openSearchModal();
                    // Small delay to ensure modal is open and data is loaded
                    setTimeout(() => {
                        displayStockDetails(value);
                    }, 100);
                });
            } else if (header === 'Representative' && value) {
                td.style.cursor = 'pointer';
                td.style.color = isHighlighted ? '#ffffff': '#76ABAE';
                td.style.textDecoration = 'underline';
                td.textContent = value;
                td.addEventListener('click', async () => {
                    openSearchModal();
                    // Small delay to ensure modal is open and data is loaded
                    setTimeout(() => {
                        // Find legislator by name
                        const legislator = legislatorList.find(l => 
                            l.name.fullname.toLowerCase() === value.toLowerCase()
                        );
                        if (legislator) {
                            displayLegislatorDetails(legislator.id.bioguide);
                        } else {
                            document.getElementById('search-results').innerHTML = 
                                '<div class="text-[#76ABAE]/50 text-center">Legislator not found</div>';
                        }
                    }, 100);
                });
            } else {
                td.textContent = value || 'N/A';
            }

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
async function displayStockDetails(symbol) {
    const stock = stockList[symbol];
    const isInWatchlist = watchlistData && watchlistData.hasOwnProperty(symbol);
    
    // Show loading state
    document.getElementById('search-results').innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="text-[#76ABAE] text-xl">Loading stock details...</div>
        </div>
    `;
    
    // Fetch historical data in parallel
    try {
        const [lobbyingData, congressData, contractsData] = await Promise.all([
            fetch(`${API_BASE}/lobbying/${symbol}`).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/congress/${symbol}`).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/contracts/${symbol}`).then(r => r.ok ? r.json() : [])
        ]);
        
        // Generate unique ID for TradingView widget
        const widgetId = `tradingview_${symbol}_${Date.now()}`;
        
        // Build historical sections
        let historicalHTML = '';
        
        // Lobbying section
        historicalHTML += `
            <div class="mt-6">
                <h4 class="text-xl font-semibold text-[#76ABAE] mb-3">Recent Lobbying Activity</h4>
                <div class="bg-[#222831] rounded-lg p-4 max-h-60 overflow-y-auto">
                    ${lobbyingData.length === 0 
                        ? '<div class="text-[#EEEEEE]/50 text-center py-4">No Lobbying Data</div>'
                        : lobbyingData.slice(0, 5).map(item => `
                            <div class="border-b border-[#76ABAE]/10 py-3 last:border-0">
                                <div class="font-semibold text-[#EEEEEE]">${item.Client}</div>
                                <div class="text-sm text-[#EEEEEE]/70 mt-1">
                                    <div>Amount: $${Number(item.Amount).toLocaleString()} • ${new Date(item.Date).toLocaleDateString()}</div>
                                    <div class="mt-1">Issue: ${item.Issue}</div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        
        // Congress trading section
        historicalHTML += `
            <div class="mt-6">
                <h4 class="text-xl font-semibold text-[#76ABAE] mb-3">Recent Congressional Trading</h4>
                <div class="bg-[#222831] rounded-lg p-4 max-h-60 overflow-y-auto">
                    ${congressData.length === 0
                        ? '<div class="text-[#EEEEEE]/50 text-center py-4">No Congressional Trading Data</div>'
                        : congressData.slice(0, 5).map(item => `
                            <div class="border-b border-[#76ABAE]/10 py-3 last:border-0">
                                <div class="font-semibold text-[#EEEEEE]">${item.Representative}</div>
                                <div class="text-sm text-[#EEEEEE]/70 mt-1">
                                    <div>${item.Transaction} • ${item.Range}</div>
                                    <div>Transaction: ${new Date(item.TransactionDate).toLocaleDateString()} • Reported: ${new Date(item.ReportDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        
        // Government contracts section
        historicalHTML += `
            <div class="mt-6">
                <h4 class="text-xl font-semibold text-[#76ABAE] mb-3">Recent Government Contracts</h4>
                <div class="bg-[#222831] rounded-lg p-4 max-h-60 overflow-y-auto">
                    ${contractsData.length === 0
                        ? '<div class="text-[#EEEEEE]/50 text-center py-4">No Government Contracts Data</div>'
                        : contractsData.slice(0, 5).map(item => `
                            <div class="border-b border-[#76ABAE]/10 py-3 last:border-0">
                                <div class="font-semibold text-[#EEEEEE]">${item.Agency}</div>
                                <div class="text-sm text-[#EEEEEE]/70 mt-1">
                                    <div>Amount: $${Number(item.Amount).toLocaleString()} • ${new Date(item.Date).toLocaleDateString()}</div>
                                    <div class="mt-1">${item.Description}</div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        
        // Display complete stock details
        document.getElementById('search-results').innerHTML = `
            <div class="space-y-4 overflow-y-auto">
                <!-- Two column layout: 1/3 left, 2/3 right -->
                <div class="flex" style="display: flex; gap: 1.3rem;">
                    <!-- Left side: Company info and counts (1/3) -->
                    <div class="w-1/3" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div class="bg-[#222831] rounded-lg p-4">
                            <h4 class="text-lg font-semibold text-[#76ABAE] mb-3">Company Information</h4>
                            <div class="space-y-2 text-sm">
                                <div><span class="text-[#76ABAE]">Market Cap:</span> <span class="text-[#EEEEEE]">$${Number(stock['Market Cap']).toLocaleString()}</span></div>
                                <div><span class="text-[#76ABAE]">Sector:</span> <span class="text-[#EEEEEE]">${stock.Sector}</span></div>
                                <div><span class="text-[#76ABAE]">Industry:</span> <span class="text-[#EEEEEE]">${stock.Industry}</span></div>
                                <div><span class="text-[#76ABAE]">Country:</span> <span class="text-[#EEEEEE]">${stock.Country}</span></div>
                            </div>
                        </div>
                        
                        <div class="bg-[#222831] rounded-lg p-4">
                            <h4 class="text-lg font-semibold text-[#76ABAE] mb-3">Activity Summary</h4>
                            <div class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-[#EEEEEE]/70">Lobbying Instances:</span>
                                    <span class="text-xl font-bold text-[#76ABAE]">${lobbyingData.length}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-[#EEEEEE]/70">Congress Trades:</span>
                                    <span class="text-xl font-bold text-[#76ABAE]">${congressData.length}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-[#EEEEEE]/70">Contracts Awarded:</span>
                                    <span class="text-xl font-bold text-[#76ABAE]">${contractsData.length}</span>
                                </div>
                            </div>
                        </div>
                        
                        <button id="watchlist-toggle-btn" class="w-full ${isInWatchlist ? 'bg-red-500 hover:bg-red-600' : 'bg-[#76ABAE] hover:bg-[#76ABAE]/80'} text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                            ${isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        </button>
                    </div>
                    
                    <!-- Right side: TradingView widget (2/3) -->
                    <div class="flex-1 bg-[#222831] rounded-lg p-4">
                        <div class="tradingview-widget-container" style="height: 100%;">
                            <div id="${widgetId}" style="height: 400px;"></div>
                        </div>
                    </div>
                </div>
                
                ${historicalHTML}
                
            </div>`;
        
        // Load TradingView widget after DOM is updated
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            "symbols": [[symbol]],
            "chartOnly": false,
            "width": "100%",
            "height": "100%",
            "locale": "en",
            "colorTheme": "dark",
            "autosize": true,
            "showVolume": true,
            "hideDateRanges": false,
            "hideMarketStatus": false,
            "hideSymbolLogo": false,
            "scalePosition": "right",
            "scaleMode": "Normal",
            "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
            "fontSize": "10",
            "noTimeScale": false,
            "valuesTracking": "1",
            "changeMode": "price-and-percent",
            "chartType": "area"
        });

        // Append script to the widget container div, not its parent
        const widgetContainer = document.getElementById(widgetId);
        widgetContainer.appendChild(script);
        
        // Add event listener to the button
        document.getElementById('watchlist-toggle-btn').addEventListener('click', async () => {
            await toggleWatchlist(symbol);
        });
        
    } catch (error) {
        console.error('Error fetching stock details:', error);
        document.getElementById('search-results').innerHTML = `
            <div class="text-red-400 text-center">
                <p class="text-xl mb-2">Failed to load stock details</p>
                <p class="text-sm">Please try again later</p>
            </div>
        `;
    }
}
async function displayLegislatorDetails(bioguideId) {
    const legislator = legislatorList.find(l => l.id.bioguide === bioguideId);
    const latestTerm = legislator.terms[legislator.terms.length - 1];
    
    // Show loading state
    document.getElementById('search-results').innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="text-[#76ABAE] text-xl">Loading legislator details...</div>
        </div>
    `;
    
    try {
        // Filter congress trading data for this representative
        const legislatorTrades = congressData.filter(trade => 
            trade.Representative.toLowerCase() === legislator.name.fullname.toLowerCase()
        );
        
        // Build count summary
        const countsHTML = `
            <div class="mt-4 p-4 bg-[#222831] rounded-lg">
                <div class="text-center">
                    <div class="text-2xl font-bold text-[#76ABAE]">${legislatorTrades.length}</div>
                    <div class="text-sm text-[#EEEEEE]/70">Total Trades</div>
                </div>
            </div>
        `;
        
        // Build committees section if available
        let committeesHTML = '';
        if (legislator.committees && legislator.committees.length > 0) {
            committeesHTML = `
                <div class="mt-6">
                    <h4 class="text-xl font-semibold text-[#76ABAE] mb-3">Committee Assignments</h4>
                    <div class="space-y-3">
                        ${legislator.committees.map(committee => `
                            <div class="bg-[#222831] p-4 rounded-lg">
                                <div class="font-semibold text-[#EEEEEE] mb-2">${committee.name}</div>
                                ${committee.subcommittees && committee.subcommittees.length > 0 ? `
                                    <div class="ml-4 mt-2">
                                        <div class="text-sm text-[#76ABAE] mb-1">Subcommittees:</div>
                                        <ul class="text-sm text-[#EEEEEE]/70 space-y-1">
                                            ${committee.subcommittees.map(sub => `
                                                <li>• ${sub.name}</li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Build trading history section
        let tradingHTML = `
            <div class="mt-6">
                <h4 class="text-xl font-semibold text-[#76ABAE] mb-3">Recent Trading Activity</h4>
                <div class="bg-[#222831] rounded-lg p-4 max-h-60 overflow-y-auto">
                    ${legislatorTrades.length === 0
                        ? '<div class="text-[#EEEEEE]/50 text-center py-4">No Trading Data</div>'
                        : legislatorTrades.slice(0, 10).map(trade => `
                            <div class="border-b border-[#76ABAE]/10 py-3 last:border-0">
                                <div class="font-semibold text-[#EEEEEE]">${trade.Ticker} - ${trade.Transaction}</div>
                                <div class="text-sm text-[#EEEEEE]/70 mt-1">
                                    <div>Amount: ${trade.Range}</div>
                                    <div>Transaction: ${new Date(trade.TransactionDate).toLocaleDateString()} • Reported: ${new Date(trade.ReportDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        
        document.getElementById('search-results').innerHTML = `
            <div class="space-y-4">
                <h3 class="text-2xl font-bold text-[#76ABAE]">${legislator.name.fullname}</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div><span class="text-[#76ABAE]">Position:</span> ${latestTerm.type === 'sen' ? 'Senator' : 'Representative'}</div>
                    <div><span class="text-[#76ABAE]">State:</span> ${latestTerm.state}</div>
                    <div><span class="text-[#76ABAE]">Party:</span> ${latestTerm.party}</div>
                    <div><span class="text-[#76ABAE]">Current Term:</span> ${latestTerm.start} to ${latestTerm.end}</div>
                </div>
                ${countsHTML}
                ${tradingHTML}
                ${committeesHTML}
            </div>`;
            
    } catch (error) {
        console.error('Error fetching legislator details:', error);
        document.getElementById('search-results').innerHTML = `
            <div class="text-red-400 text-center">
                <p class="text-xl mb-2">Failed to load legislator details</p>
                <p class="text-sm">Please try again later</p>
            </div>
        `;
    }
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