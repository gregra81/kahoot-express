const axios = require('axios');
const clientId = process.env.BIZZABO_CLIENT_ID;
const clientSecret = process.env.BIZZABO_CLIENT_SECRET;

const issuerBaseUrl = process.env.AUTH_SERVER;
const apiServer = process.env.API_SERVER;
const audience = 'https://api.bizzabo.com/api';

const getToken = async (accountId) => {
    try {
        const oauthPayload = {
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            audience: audience,
            account_id: accountId,
        }

        if (process.env.NODE_ENV !== 'production') {
            oauthPayload.api_server = apiServer;
        }
    
        const resp = await axios.post(`${issuerBaseUrl}/oauth/token`, oauthPayload);

        return resp.data.access_token;
  
    } catch(error) {
        console.error(error);
        throw Error("Not Authorized");
    }
}

const getContacts = async (accountId, eventId) => {

    return await axios.get(`${apiServer}/v1/events/${eventId}/contacts?size=200`, {
        headers : {
            'Authorization': `Bearer ${await getToken(accountId)}`
        } 
    }); 
}

const getSession = async (accountId, eventId, sessionId) => {
    console.log(apiServer)
    return await axios.get(`${apiServer}/v1/events/${eventId}/agenda/sessions/${sessionId}`, {
        headers : {
            'Authorization': `Bearer ${await getToken(accountId)}`
        }
    });
}

/** PUBLIC METHODS **/

module.exports = {
    getContacts,
    getSession
}
