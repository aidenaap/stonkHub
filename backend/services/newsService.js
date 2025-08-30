const axios = require('axios');
const NEWSORGKEY = process.env.NEWSORGKEY;
const legacyBaseURL = "https://newsapi.org/v2";

const businessNews = `${legacyBaseURL}/top-headlines?country=us&language=en&category=business&apiKey=${process.env.NEWSORGKEY}`;
const techNewsURL = `${legacyBaseURL}/top-headlines?country=us&language=en&category=technology&apiKey=${process.env.NEWSORGKEY}`;


const fetchNewsData = async() => {
    var newsData = []

    try {
        let topHeadlineResponse = await axios.get(businessNews);

        // console.log('Top Headlines:');
        // console.log(topHeadlineResponse.data);

        for (let i = 0; i < topHeadlineResponse.data.articles.length; i++) {

            let article = {
            title: topHeadlineResponse.data.articles[i].title,
            description: topHeadlineResponse.data.articles[i].description,
            url: topHeadlineResponse.data.articles[i].url,
            source: topHeadlineResponse.data.articles[i].source.name,
            type: 'Top Story'
            };
            newsData.push(article);

        }

        let techNewsResponse = await axios.get(techNewsURL);

        // console.log('Top Tech:');
        // console.log(techNewsResponse.data);

        for (let i = 0; i < techNewsResponse.data.articles.length; i++) {
            let article = {
                title: techNewsResponse.data.articles[i].title,
                description: techNewsResponse.data.articles[i].description,
                url: techNewsResponse.data.articles[i].url,
                source: techNewsResponse.data.articles[i].source.name,
                type: 'Tech'
            };
            newsData.push(article);
        }

        console.log('News data:');
        console.log(newsData);

        return newsData;

    } catch (e) {
    console.error('Error fetching data from NewsAPI:', e.message);
        return null;
    }
};

module.exports = {
    fetchNewsData
};