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

module.exports = {
    Cache,
    getCacheInstance
}