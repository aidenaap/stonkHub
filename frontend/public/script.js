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
let sectorData;
let marketOverviewData;
let economicCalendarData;
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
const watchlistHeaders = ['Ticker', 'Daily', 'Current', 'Change', '% Change', 'Open', 'Prev Close', 'Remove'];


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

async function loadInitialData() {
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

    // Sector data
    const sectorResponse = await fetch(`${API_BASE}/sectors`);
    sectorData = await sectorResponse.json();
    console.log('Sector data loaded:', sectorData);

    const marketOverviewResponse = await fetch(`${API_BASE}/market-overview`);
    marketOverviewData = await marketOverviewResponse.json();

    // Economic calendar data (FOMC + BLS releases)
    const economicCalendarResponse = await fetch(`${API_BASE}/economic-calendar?count=15`);
    economicCalendarData = await economicCalendarResponse.json();

    // News data
    const newsResponse = await fetch(`${API_BASE}/news`);
    newsData = await newsResponse.json();

    // watchlist data
    const watchlistResponse = await fetch(`${API_BASE}/watchlist`);
    watchlistData = await watchlistResponse.json();
    const tickers = Object.keys(watchlistData);

    // live stockData based on watchlist
    if (tickers.length > 0) {
        const stockResponse = await fetch(`${API_BASE}/stocklist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stocklist: tickers })
        });
        stockData = await stockResponse.json();
    }

    // Populate the top ticker bar
    populateTickerBar();

    // Display homepage upon startup
    currentDataType = 'home';
    toggleHomePage();
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

// ===== Watchlist Sparkline Charts ===== //
function generateSparkline(ticker, prices, isPositive) {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 30;
    canvas.style.display = 'block';
    
    const ctx = canvas.getContext('2d');
    const color = isPositive ? '#4ade80' : '#f87171';
    
    if (!prices || prices.length === 0) {
        return canvas;
    }
    
    // Calculate scaling
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min || 1;
    const xStep = canvas.width / (prices.length - 1);
    
    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    
    prices.forEach((price, i) => {
        const x = i * xStep;
        const y = canvas.height - ((price - min) / range) * canvas.height;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Fill area under line with gradient
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, color + '40'); // 25% opacity
    gradient.addColorStop(1, color + '00'); // 0% opacity
    ctx.fillStyle = gradient;
    ctx.fill();
    
    return canvas;
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
// Unique homepage functionality
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
function toggleHomePage() {
    if (currentDataType !== 'home') {
        restoreTableStructure();
        return;
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

    // Build calendar section
    const economicCalendarHTML = buildEconomicCalendarSection();
    
    // Build market overview section
    const majorIndicesHTML = buildMarketOverviewSection();

    // Build sectors section
    const sectorsHTML = buildSectorsSection();
    
    // Build the main content
    mainContent.innerHTML = `
    <div class="homepage-container">
        <!-- Top Stats Row -->
        <div class="stats-row">
            <!-- Greed/Fear Index Card -->
            <div class="stat-card greed-fear-card">
                <div class="card-header">
                    <span class="card-icon">📊</span>
                    <h3>Congressional Sentiment</h3>
                </div>
                <div class="gauge-container">
                    <div id="greed-fear-gauge"></div>
                    <div class="sentiment-label ${greedFearIndex.index <= 3 ? 'fear' : greedFearIndex.index >= 7 ? 'greed' : 'neutral'}">
                        ${greedFearIndex.index <= 3 ? '🐻 Extreme Fear' : 
                          greedFearIndex.index <= 4 ? '😰 Fear' :
                          greedFearIndex.index <= 6 ? '😐 Neutral' :
                          greedFearIndex.index <= 8 ? '😊 Greed' : '🚀 Extreme Greed'}
                    </div>
                    <div class="trade-counts">
                        <span class="buys">${greedFearIndex.purchaseCount} buys</span>
                        <span class="divider">•</span>
                        <span class="sells">${greedFearIndex.saleCount} sells</span>
                    </div>
                </div>
            </div>

            <!-- FOMC Calendar Card -->
            <div class="stat-card fomc-card">
                <div class="card-header">
                    <span class="card-icon">🏛️</span>
                    <h3>Upcoming Events</h3>
                </div>
                ${economicCalendarHTML}
            </div>

            <!-- Quick Stats Card -->
            <div class="stat-card quick-stats-card">
                <div class="card-header">
                    <span class="card-icon">⚡</span>
                    <h3>Activity Snapshot</h3>
                </div>
                <div class="quick-stats-grid">
                    <div class="quick-stat" onclick="scrollToSection('notable-trades')">
                        <div class="stat-value">${sortedNoticeableTrades.length}</div>
                        <div class="stat-label">Large Trades</div>
                        <div class="stat-sublabel">≥ $50,001</div>
                    </div>
                    <div class="quick-stat" onclick="scrollToSection('frequent-trades')">
                        <div class="stat-value">${frequentTrades.length}</div>
                        <div class="stat-label">Hot Tickers</div>
                        <div class="stat-sublabel">3+ trades/3mo</div>
                    </div>
                    <div class="quick-stat" onclick="scrollToSection('multi-indicator')">
                        <div class="stat-value">${multipleIndicators.length}</div>
                        <div class="stat-label">Multi-Signal</div>
                        <div class="stat-sublabel">10+ indicators</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Major Indices Section -->
        ${majorIndicesHTML}

        <!-- Sector Performance Section -->
        <div class="section-container sectors-section">
            <div class="section-header">
                <div class="section-title">
                    <span class="section-icon">📈</span>
                    <h2>Sector Performance</h2>
                </div>
                <div class="market-sentiment ${sectorData?.sectors ? (getSectorSentiment() === 'Bullish' ? 'bullish' : getSectorSentiment() === 'Bearish' ? 'bearish' : 'neutral') : ''}">
                    ${sectorData?.sectors ? getSectorSentiment() : 'Loading...'}
                </div>
            </div>
            ${sectorsHTML}
        </div>

        <!-- Activity Details Section (Tabbed) -->
        <div class="section-container activity-section">
            <div class="section-header">
                <div class="section-title">
                    <span class="section-icon">🔍</span>
                    <h2>Congressional Activity</h2>
                </div>
                <div class="tab-buttons">
                    <button class="tab-btn active" onclick="switchActivityTab('notable')">Notable Trades</button>
                    <button class="tab-btn" onclick="switchActivityTab('frequent')">Frequent</button>
                    <button class="tab-btn" onclick="switchActivityTab('multi')">Multi-Signal</button>
                </div>
            </div>
            
            <!-- Notable Trades Tab -->
            <div id="notable-trades" class="activity-tab active">
                <div class="trades-grid">
                    ${sortedNoticeableTrades.length === 0 
                        ? '<div class="empty-state">No large trades found</div>'
                        : sortedNoticeableTrades.map(trade => `
                            <div class="trade-card" onclick="openStockFromHomepage('${trade.Ticker}')">
                                <div class="trade-header">
                                    <span class="trade-ticker">${trade.Ticker}</span>
                                    <span class="trade-type ${trade.Transaction.toLowerCase().includes('purchase') || trade.Transaction.toLowerCase().includes('buy') ? 'buy' : 'sell'}">
                                        ${trade.Transaction.toLowerCase().includes('purchase') || trade.Transaction.toLowerCase().includes('buy') ? 'BUY' : 'SELL'}
                                    </span>
                                </div>
                                <div class="trade-amount">$${Number(trade.Amount).toLocaleString()}</div>
                                <div class="trade-meta">
                                    <span class="trade-rep">${trade.Representative.split(' ').slice(0, 2).join(' ')}</span>
                                    <span class="trade-date">${new Date(trade.TransactionDate + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })}</span>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>

            <!-- Frequent Trades Tab -->
            <div id="frequent-trades" class="activity-tab">
                <div class="trades-grid">
                    ${frequentTrades.length === 0 
                        ? '<div class="empty-state">No frequent trades found</div>'
                        : frequentTrades.slice(0, 12).map(item => `
                            <div class="trade-card" onclick="openStockFromHomepage('${item.ticker}')">
                                <div class="trade-header">
                                    <span class="trade-ticker">${item.ticker}</span>
                                    <span class="trade-count">${item.count}x</span>
                                </div>
                                <div class="trade-amount">${item.count} trades</div>
                                <div class="trade-meta">
                                    <span class="trade-sublabel">Past 3 months</span>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
                ${frequentTrades.length > 12 ? `<div class="show-more-hint">${frequentTrades.length - 12} more tickers</div>` : ''}
            </div>

            <!-- Multi-Signal Tab -->
            <div id="multi-indicator" class="activity-tab">
                <div class="trades-grid">
                    ${multipleIndicators.length === 0 
                        ? '<div class="empty-state">No multi-signal stocks found</div>'
                        : multipleIndicators.slice(0, 12).map(item => `
                            <div class="trade-card" onclick="openStockFromHomepage('${item.ticker}')">
                                <div class="trade-header">
                                    <span class="trade-ticker">${item.ticker}</span>
                                    <span class="trade-count">${item.totalCount}</span>
                                </div>
                                <div class="signal-breakdown">
                                    <span class="signal congress">${item.congressCount} congress</span>
                                    <span class="signal lobbying">${item.lobbyingCount} lobby</span>
                                    <span class="signal contracts">${item.contractCount} contract</span>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
                ${multipleIndicators.length > 12 ? `<div class="show-more-hint">${multipleIndicators.length - 12} more stocks</div>` : ''}
            </div>
        </div>
    </div>
    `;

    // Render the gauge chart after DOM is updated
    setTimeout(() => {
        renderGreedFearGauge(greedFearIndex.index);
    }, 100);
}
function buildEconomicCalendarSection() {
    if (!economicCalendarData || !economicCalendarData.events || economicCalendarData.events.length === 0) {
        return `
            <div class="calendar-section">
                <h3 class="section-title">📅 Economic Calendar</h3>
                <div class="calendar-card">
                    <div class="text-center text-muted">No upcoming events</div>
                </div>
            </div>
        `;
    }
    
    const events = economicCalendarData.events;
    
    return `
        <div class="calendar-section">
            <h3 class="section-title">📅 Economic Calendar</h3>
            <div class="calendar-card">
                <div class="calendar-scroll">
                    ${events.map(event => `
                        <div class="calendar-item ${event.isToday ? 'is-today' : ''} ${event.isTomorrow ? 'is-tomorrow' : ''}">
                            <div class="calendar-item-left">
                                <span class="event-icon" style="background: ${event.color}20; color: ${event.color};">${event.icon}</span>
                                <div class="event-details">
                                    <div class="event-name">${event.name}</div>
                                    <div class="event-meta">
                                        ${event.for ? `<span class="event-for">${event.for}</span>` : ''}
                                        ${event.hasSEP ? '<span class="sep-badge">+SEP</span>' : ''}
                                    </div>
                                </div>
                            </div>
                            <div class="calendar-item-right">
                                <div class="event-date">${event.formattedDate}</div>
                                <div class="event-time">${event.formattedTime} ET</div>
                                <div class="event-countdown ${event.isToday ? 'countdown-today' : event.isTomorrow ? 'countdown-tomorrow' : event.isThisWeek ? 'countdown-week' : ''}">
                                    ${event.isToday ? 'TODAY' : event.isTomorrow ? 'TOMORROW' : event.daysUntil + 'd'}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}
function buildSectorsSection() {
    if (!sectorData || !sectorData.sectors) {
        return '<div class="empty-state">Loading sector data...</div>';
    }

    return `
        <div class="sectors-grid">
            ${sectorData.sectors.map(sector => `
                <div class="sector-card ${sector.isPositive ? 'positive' : 'negative'}" style="--sector-color: ${sector.color}">
                    <div class="sector-symbol">${sector.symbol}</div>
                    <div class="sector-name">${sector.name}</div>
                    <div class="sector-change ${sector.isPositive ? 'up' : 'down'}">
                        ${sector.isPositive ? '▲' : '▼'} ${Math.abs(sector.percentChange).toFixed(2)}%
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}
function getSectorSentiment() {
    if (!sectorData || !sectorData.sectors) return 'Loading';
    
    const validSectors = sectorData.sectors.filter(s => s.percentChange !== null);
    const avgChange = validSectors.reduce((sum, s) => sum + s.percentChange, 0) / validSectors.length;
    
    if (avgChange > 0.5) return 'Bullish';
    if (avgChange < -0.5) return 'Bearish';
    return 'Neutral';
}
function buildMarketOverviewSection() {
    if (!marketOverviewData || marketOverviewData.length === 0) {
        return '';
    }
    
    // Calculate dollar health based on DXY
    const dxy = marketOverviewData.find(item => item.shortName === 'DXY');
    const dollarHealth = getDollarHealth(dxy);
    
    // Sort by absolute change percent (biggest movers first) - optional, or keep original order
    const sortedData = [...marketOverviewData];
    
    return `
        <div class="sectors-section">
            <div class="sectors-header">
                <h3 class="section-title">📈 Market Overview</h3>
                <span class="market-sentiment-badge ${dollarHealth.class}">${dollarHealth.icon} Dollar: ${dollarHealth.label}</span>
            </div>
            <div class="sectors-grid">
                ${sortedData.map(item => {
                    if (item.error || item.price === null) {
                        return `
                            <div class="sector-card" style="border-top-color: rgba(118, 171, 174, 0.3); opacity: 0.5;">
                                <div class="sector-symbol">${item.shortName}</div>
                                <div class="sector-name">${item.name}</div>
                                <div class="sector-change">--</div>
                            </div>
                        `;
                    }
                    
                    const isPositive = item.changePercent >= 0;
                    const arrow = isPositive ? '▲' : '▼';
                    const changeClass = isPositive ? 'positive' : 'negative';
                    const accentColor = isPositive ? '#4ade80' : '#f87171';
                    
                    // Format price based on value
                    let formattedPrice;
                    if (item.price >= 10000) {
                        formattedPrice = item.price.toLocaleString('en-US', { maximumFractionDigits: 0 });
                    } else if (item.price >= 100) {
                        formattedPrice = item.price.toFixed(2);
                    } else {
                        formattedPrice = item.price.toFixed(2);
                    }
                    
                    return `
                        <div class="sector-card ${changeClass}" style="border-top-color: ${accentColor};">
                            <div class="sector-symbol">${item.shortName}</div>
                            <div class="sector-name">${item.name}</div>
                            <div class="sector-price">${formattedPrice}</div>
                            <div class="sector-change ${changeClass}">
                                ${arrow} ${Math.abs(item.changePercent).toFixed(2)}%
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}
function getDollarHealth(dxy) {
    if (!dxy || dxy.error || dxy.changePercent === null) {
        return { label: 'Unknown', class: 'sentiment-neutral', icon: '⚖️' };
    }
    
    const change = dxy.changePercent;
    
    if (change >= 0.5) {
        return { label: 'Strong', class: 'sentiment-bullish', icon: '💪' };
    } else if (change >= 0.1) {
        return { label: 'Firm', class: 'sentiment-bullish', icon: '📈' };
    } else if (change <= -0.5) {
        return { label: 'Weak', class: 'sentiment-bearish', icon: '📉' };
    } else if (change <= -0.1) {
        return { label: 'Soft', class: 'sentiment-bearish', icon: '😟' };
    } else {
        return { label: 'Stable', class: 'sentiment-neutral', icon: '⚖️' };
    }
}
function switchActivityTab(tabName) {
    // Update button states
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab visibility
    document.querySelectorAll('.activity-tab').forEach(tab => tab.classList.remove('active'));
    
    switch(tabName) {
        case 'notable':
            document.getElementById('notable-trades').classList.add('active');
            break;
        case 'frequent':
            document.getElementById('frequent-trades').classList.add('active');
            break;
        case 'multi':
            document.getElementById('multi-indicator').classList.add('active');
            break;
    }
}
function scrollToSection(sectionId) {
    // Switch to the appropriate tab
    const tabMap = {
        'notable-trades': 'notable',
        'frequent-trades': 'frequent',
        'multi-indicator': 'multi'
    };
    
    // Find and click the appropriate tab button
    const tabName = tabMap[sectionId];
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName.substring(0, 5))) {
            btn.click();
        }
    });
    
    // Scroll to section
    document.querySelector('.activity-section')?.scrollIntoView({ behavior: 'smooth' });
}

// For each, set active tab, title above table, currentData, currentDataType, and displayTableData
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
async function loadWatchlistPage() {  // unique functionality
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

        // Fetch all intraday data at once (using tickers already declared above)
        let intradayData = {};

        try {
            const intradayResponse = await fetch(`${API_BASE}/stocklist/intraday/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tickers })
            });
            
            if (intradayResponse.ok) {
                intradayData = await intradayResponse.json();
            }
        } catch (error) {
            console.error('Error fetching intraday data:', error);
        }

        // Store globally so displayTableData can access it
        window.currentIntradayData = intradayData;

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
async function toggleWatchlist(ticker) { // watchlist add/rm functionality
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

// ===== Primary Table Display ===== //
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
function createTableCell(header, item, isHighlighted, tr) {
    const td = document.createElement('td');
    td.className = isHighlighted 
        ? 'px-4 py-3 text-[#EEEEEE] font-medium' 
        : 'px-4 py-3 text-[#EEEEEE]';

    let value = item[header];
    if (currentDataType === 'news') {
        value = item[header.toLowerCase()];
    }

    // Handle different column types
    if ((header === 'Amount' || header === 'Current' || header === 'Open' || header === 'Prev Close') && value) {
        value = '$' + Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        if (isHighlighted) {
            td.classList.add('font-bold');
        }
        td.textContent = value || 'N/A';
    } else if (header.includes('Date') && value) {
        const date = new Date(value + 'T00:00:00Z');
        value = date.toLocaleDateString('en-US', { 
            timeZone: 'UTC',
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        });
        td.textContent = value || 'N/A';
    } else if (header === 'Change' && value !== null && value !== undefined) {
        td.classList.add(value > 0 ? 'pos-change' : 'neg-change');
        const absValue = Math.abs(value);
        td.textContent = value < 0 ? '-$' + absValue.toFixed(2) : '$' + Number(value).toFixed(2);
    } else if (header === '% Change' && value !== null && value !== undefined) {
        td.classList.add(value > 0 ? 'pos-change' : 'neg-change');
        td.textContent = Number(value).toFixed(2) + ' %';
    } else if (header === 'Daily' && value === undefined) {
        const ticker = item.Ticker;
        const change = parseFloat(item.Change) || 0;
        
        if (window.currentIntradayData && window.currentIntradayData[ticker]) {
            const prices = window.currentIntradayData[ticker];
            if (prices.length > 0) {
                const sparkline = generateSparkline(ticker, prices, change >= 0);
                td.appendChild(sparkline);
            } else {
                td.innerHTML = '<div class="text-[#EEEEEE]/50 text-xs">N/A</div>';
            }
        } else {
            td.innerHTML = '<div class="text-[#EEEEEE]/50 text-xs">N/A</div>';
        }
    } else if (header === 'URL') {
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
    } else if (header === 'AI Review') {
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
                    console.error("Error deleting ticker:", ticker);
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
            setTimeout(() => {
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

    return td;
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

        headers.forEach(header => {
            const td = createTableCell(header, item, isHighlighted, tr);
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

// ===== Primary Table Filtering ===== //
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
            ? 'border-b border-[#76ABAE]/10 hover:bg-[#76ABAE]/30 bg-[#76ABAE]/20 isHighlightedRow' 
            : 'border-b border-[#76ABAE]/10 hover:bg-[#222831]/50';

        headers.forEach(header => {
            const td = createTableCell(header, item, isHighlighted, tr);
            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });
}

// ===== Homepage Helpers ===== //
function renderGreedFearGauge(index) {
    // Calculate color based on index
    let gaugeColor;
    if (index <= 3) {
        gaugeColor = '#f87171'; // Red (fear)
    } else if (index <= 4) {
        gaugeColor = '#fb923c'; // Orange
    } else if (index <= 6) {
        gaugeColor = '#fbbf24'; // Yellow (neutral)
    } else if (index <= 8) {
        gaugeColor = '#a3e635'; // Light green
    } else {
        gaugeColor = '#4ade80'; // Green (greed)
    }
    
    const options = {
        series: [index * 10], // Convert 0-10 scale to 0-100 percentage
        chart: {
            type: 'radialBar',
            height: 220,
            offsetY: -10,
            sparkline: {
                enabled: false
            },
            background: 'transparent'
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: {
                    margin: 0,
                    size: '65%',
                    background: '#222831',
                },
                track: {
                    background: '#31363F',
                    strokeWidth: '100%',
                    margin: 5,
                },
                dataLabels: {
                    show: true,
                    name: {
                        show: false
                    },
                    value: {
                        offsetY: 5,
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: '#EEEEEE',
                        formatter: function(val) {
                            return (val / 10).toFixed(1);
                        }
                    }
                }
            }
        },
        fill: {
            type: 'solid',
            colors: [gaugeColor]
        },
        stroke: {
            lineCap: 'round'
        },
        labels: ['Greed/Fear']
    };
    
    // Clear any existing chart
    const chartElement = document.querySelector('#greed-fear-gauge');
    if (chartElement) {
        chartElement.innerHTML = '';
        const chart = new ApexCharts(chartElement, options);
        chart.render();
    }
}
function restoreTableStructure() { // restore basic table structure when swapping from homepage
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
// Display types
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

// ===== AI News Summary Pop-up ===== //
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