const { Sequelize, QueryTypes } = require('sequelize');
const format = require('pg-format');

class Cache {
    instance;
    constructor() {
        this.sequelize = new Sequelize(process.env.DATABASE_URL, {
            dialect: 'postgres',
          })
    }

    async cacheGet(cacheKey) {
        const res = await this.sequelize.query(
            `SELECT value, expires FROM cache WHERE key='${cacheKey}' AND expires > NOW()`,
            { type: QueryTypes.SELECT }
          );
        if (res.length > 0) {
            return res.pop().value;
        }

        return false;
    }

    /**
     * Set cache value
     * @param {*} cacheKey 
     * @param {*} cacheValue 
     * @param {*} expiration - in minutes
     */
    async cacheSet(cacheKey, cacheValue, expiration = 1) {
        const query =
            `INSERT INTO cache (key, value, expires) ` +
            `VALUES('${cacheKey}',${format.literal(JSON.stringify(cacheValue))},NOW() + '${expiration} minutes')` +
            `ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, expires=NOW() + '${expiration} minutes'`
        ;
        await this.sequelize.query(query);


    }
}

function getCacheInstance() {
    if (Cache.instance){
        return Cache.instance;
    }

    Cache.instance = new Cache();
    return Cache.instance;
}

/**
 * Caches api calls responses (assumes usage of axios)
 * Usage:
 *   const result = await cachedApiCall(functionThatUsesAxios, 20)(paramA, paramB, ...) // cache result for 20 minutes
 * @param {function} fn - The function to cache
 * @param {number} cacheTime - in minutes 
 * @returns 
 */
function cachedApiCall(fn, cacheTime) {
    const cache = getCacheInstance();
    return async function() {
        let cacheKey = `${fn.name}_${Object.values(arguments).join('_')}`;
        const cachedData = await cache.cacheGet(cacheKey);
        if (cachedData) {
            console.log(`fetched from cache for ${cacheKey}`);
            return cachedData;
        } else {
            let result = await fn.apply(this, arguments);
            await cache.cacheSet(cacheKey, result.data, cacheTime);
            return result.data;
        }
    }
  }

module.exports = {
    Cache,
    getCacheInstance,
    cachedApiCall,
}