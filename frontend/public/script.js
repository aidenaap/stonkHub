const API_BASE = '/api';
// primary table data storage
let currentData = [];
let filteredData = [];
let currentDataType = 'lobbying';
const lobbyingHeaders = ['Ticker', 'Client', 'Date', 'Amount', 'Issue', 'Specific_Issue', 'Registrant'];
const congressHeaders = ['Representative', 'Ticker', 'Transaction', 'Amount', 'Range', 'TransactionDate', 'ReportDate', 'Party', 'House'];
const contractHeaders = ['Ticker', 'Agency', 'Date', 'Amount', 'Description'];
const newsHeaders = ['Title', 'Description', 'Type', 'URL'];
// navbar search iteration 
let placeholderIndex = 0;
const placeholders = ["Search tickers...", "Search politicians...", "Search greatness..."];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadLobbying();
    setupFilterListener();
    setInterval(animatePlaceholder, 3000); // Change every 3 seconds
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

// Load data and setup headers accordingly
async function loadLobbying() {
    try {
        setActiveTab(document.getElementById('lobbying-btn'));
        document.getElementById('table-title').textContent = 'Lobbying Data';
        showLoading();
        
        const response = await fetch(`${API_BASE}/lobbying`);
        const data = await response.json();
        currentData = data;
        currentDataType = 'lobbying';
        displayTableData(data, lobbyingHeaders);
    } catch (error) {
        console.error('Error loading lobbying data:', error);
        showError('Failed to load lobbying data');
    }
}
async function loadCongress() {
    try {
        setActiveTab(document.getElementById('congress-btn'));
        document.getElementById('table-title').textContent = 'Congress Trading Data';
        showLoading();
        
        const response = await fetch(`${API_BASE}/congress`);
        const data = await response.json();
        currentData = data;
        currentDataType = 'congress';
        displayTableData(data, congressHeaders);
    } catch (error) {
        console.error('Error loading congress data:', error);
        showError('Failed to load congress trading data');
    }
}
async function loadContracts() {
    try {
        setActiveTab(document.getElementById('contracts-btn'));
        document.getElementById('table-title').textContent = 'Government Contracts Data';
        showLoading();
        
        const response = await fetch(`${API_BASE}/contracts`);
        const data = await response.json();
        currentData = data;
        currentDataType = 'contracts';
        displayTableData(data, contractHeaders);
    } catch (error) {
        console.error('Error loading contracts data:', error);
        showError('Failed to load government contracts data');
    }
}
async function loadNews() {

    try {
        setActiveTab(document.getElementById('news-btn'));
        document.getElementById('table-title').textContent = 'Top Headlines & Tech News';
        showLoading();
        console.log("Should be showing loading");
        
        const response = await fetch(`${API_BASE}/news`);
        const data = await response.json();
        currentData = data;
        currentDataType = 'news';
        console.log("data right before calling displayTableData:")
        console.log(data);
        displayTableData(data, newsHeaders);
    } catch (error) {
        console.error('Error loading news', error);
        showError('Failed to load news data');
    }
}

// Load watchlist and e
async function loadWatchlist() {

}

// Display base information with highlighting
function displayTableData(data, headers) {
    console.log("data inside of the displaytabledata:");
    console.log(data);

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
    
    // Show table, hide loading
    loading.classList.add('hidden');
    table.classList.remove('hidden');
    
    filteredData = data;
    document.getElementById('filter-input').value = '';
}

// Filtering functionality with highlighting
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
        case 'lobbying': headers = getLobbyingHeaders(); break;
        case 'congress': headers = getCongressHeaders(); break;
        case 'contracts': headers = getContractsHeaders(); break;
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