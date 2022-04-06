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

const getContactsPaginated = async (accountId, eventId, page) => {
    const { data } = await axios.get(`${apiServer}/v1/events/${eventId}/contacts`, {
      params: {
        size: 200,
        page,
      },
      headers: {
        Authorization: `Bearer ${await getToken(accountId)}`,
      },
    });
  
    return { pagination: data.page, contacts: data.content };
}

/**
 * Return paginated contacts and cache it so for the next calls we're getting
 * cached data instead of hitting the Bizzabo APIs
 * @param {*} accountId 
 * @param {*} eventId 
 * @param {*} cacheTime - in minutes
 * @returns 
 */
const getPaginatedContactsCached = async (accountId, eventId, page, cacheTime = 10) => {
    const cachedContactsFunc = cachedApiCall(getContactsPaginated, cacheTime);
    const data = await cachedContactsFunc(accountId, eventId, page);
    return data;
}

/** PUBLIC METHODS **/

 const getContact = async (accountId, eventId, email) => {
    let contact = undefined;
    let currentPage = 0;
  
    while (true) {
      currentPage += 1;
  
      const { pagination, contacts } = await getPaginatedContactsCached(
        accountId,
        eventId,
        currentPage
      );
  
        if (contacts) { 
            contact = contacts.find((c) => c.properties.email === email);
            if (contact !== undefined || pagination.totalPages === currentPage) {
                break;
            }
        }
    }
  
    return contact;
}

const getSession = async (accountId, eventId, sessionId) => {
    return await axios.get(`${apiServer}/v1/events/${eventId}/agenda/sessions/${sessionId}`, {
        headers : {
            'Authorization': `Bearer ${await getToken(accountId)}`
        }
    });
}

module.exports = {
    getContact,
    getSession
}
