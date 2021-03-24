const axios = require('axios');
const TurndownService = require('turndown');
var turndownService = new TurndownService();

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const message = event.Records[0].Sns.Message;
    console.log('From SNS:', message);
    
    var bit = JSON.parse(message);
    
    var markdown = turndownService.turndown(bit.content);
    
    const resp = await axios.post(process.env.SLACK_WEBHOOK_URL, {
        Content: `New Bacon Bit in ${bit.env.toUpperCase()}: \n------------------------------------\n SERVICE: ${bit.service}\nCATEGORY: ${bit.category}\nNAME: ${bit.name}\nLINK: https://${bit.env === 'dev' ? 'dev.' : ''}bcnbitz.com/?search=${bit.id}\n------------------------------------\n${markdown}`
    });
    
    console.log(resp);
};
