const buffer = require('buffer');

let unsafeAuth = async () => {
    let token = "eshghie@kth.se:Test4Academ1cAcc0untPa$$word";
    let encoded = buffer.Buffer.from(token).toString('base64');
    return "Basic " + encoded; 
}

module.exports = unsafeAuth;