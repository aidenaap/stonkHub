async function summarizeArticle(articleUrl, articleTitle, articleDescription) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            console.error('OPENAI_API_KEY not found in environment variables');
            throw new Error('OpenAI API key not configured');
        }

        console.log('Generating summary for:', articleTitle);

        const prompt = `Analyze this news article and provide a concise summary focusing on:
- Key takeaways (2-3 main points)
- Market/political implications
- Any notable figures or companies mentioned

Article Title: ${articleTitle}
Article Description: ${articleDescription}
Article URL: ${articleUrl}

Provide a professional summary in 3-4 paragraphs.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a financial and political news analyst providing concise, professional summaries.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('OpenAI API Error:', data);
            throw new Error(data.error?.message || 'OpenAI API request failed');
        }

        console.log('Summary generated successfully');

        return {
            summary: data.choices[0].message.content,
            title: articleTitle,
            url: articleUrl,
            description: articleDescription
        };

    } catch (error) {
        console.error('Error in summarizeArticle:', error.message);
        throw error;
    }
}

module.exports = { summarizeArticle };