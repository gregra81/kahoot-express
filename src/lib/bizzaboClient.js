const axios = require('axios');
const { getCacheInstance, cachedApiCall } = require('./cache');
const clientId = process.env.BIZZABO_CLIENT_ID;
const clientSecret = process.env.BIZZABO_CLIENT_SECRET;

const issuerBaseUrl = process.env.AUTH_SERVER;
const apiServer = process.env.API_SERVER;
const audience = 'https://api.bizzabo.com/api';

const getToken = async (accountId) => {
    const cache = getCacheInstance();
    const cacheKey = `token_${accountId}`;
    const token = await cache.cacheGet(cacheKey);
    if (token) {
        console.log('Returning a cached token');
        return token;
    }    
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
        // set expiry to the future and substract 5 minutes (300 sec) to be on the safe side
        const expiration = (resp.data.expires_in / 60) - 5;
        await cache.cacheSet(cacheKey, resp.data.access_token, expiration);

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
    return await axios.get(`${apiServer}/v1/events/${eventId}/agenda/sessions/${sessionId}`, {
        headers : {
            'Authorization': `Bearer ${await getToken(accountId)}`
        }
    });
}

/** PUBLIC METHODS **/
/**
 * Reyturn contacts and cache them so for the next calls we're getting
 * cached data instead of hitting the Bizzabo APIs
 * @param {*} accountId 
 * @param {*} eventId 
 * @param {*} cacheTime - in minutes
 * @returns 
 */
const getContactsCached = async (accountId, eventId, cacheTime = 10) => {
    const cachedContactsFunc = cachedApiCall(getContacts, cacheTime);
    const contacts = await cachedContactsFunc(accountId, eventId);

    return contacts.content;
}


module.exports = {
    getContactsCached,
    getSession
}
