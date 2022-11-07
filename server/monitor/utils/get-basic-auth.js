const buffer = require('buffer');
const get_user_pass = require('./get-user-pass');

let basic_auth = () => {
    return get_user_pass().then((res) => {
        let token = res['username'] + ":" + res['pass'];
        let hash = buffer.Buffer.from(token).toString('base64'); 
        return "Basic " + hash; 
    }); 
}

module.exports = basic_auth;
