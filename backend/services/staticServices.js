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

async function getEconomicCalendar() {
    try {
        const filePath = path.join(__dirname, '../storage/economicCalendar.json');
        const data = await fs.readFile(filePath, 'utf8');
        const calendarData = JSON.parse(data);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingEvents = calendarData.releases
            .filter(release => {
                const eventDate = new Date(release.date + 'T00:00:00');
                return eventDate >= today;
            })
            .map(release => {
                const eventDate = new Date(release.date + 'T00:00:00');
                const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
                const eventType = calendarData.eventTypes[release.event] || {};
                
                // Format time from 24h to 12h
                const [hours, minutes] = release.time.split(':');
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                const formattedTime = `${hour12}:${minutes} ${ampm}`;
                
                return {
                    ...release,
                    daysUntil,
                    isToday: daysUntil === 0,
                    isTomorrow: daysUntil === 1,
                    isThisWeek: daysUntil <= 7,
                    color: eventType.color || '#76ABAE',
                    icon: eventType.icon || '📅',
                    impact: eventType.impact || 'medium',
                    formattedDate: eventDate.toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric' 
                    }),
                    formattedTime
                };
            });
        
        return upcomingEvents;
    } catch (error) {
        console.error('Error reading economic calendar:', error);
        return [];
    }
}

module.exports = { getStockList, getLegislatorList, getEconomicCalendar };