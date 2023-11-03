require('module-alias/register');
const getBasicAuth = require('@lib/auth/unsafe-authenticate');

const createAuthInstance = async () => {
    const basicAuth = await getBasicAuth();
    return axios.create({
        headers: {
        Authorization: basicAuth
        }
    });
}

module.exports = {
    createAuthInstance,
}