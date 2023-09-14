const axios = require('axios');
let get_basic_auth = require('./get-basic-auth');
let scutil = require('./scutil');
const xml2js = require('xml2js');

let getRolesDCR = (dcr_id) => {

  get_basic_auth().then(basic_authorization => {
    let req_instance = axios.create({
        headers: {
        Authorization: basic_authorization
        }
    });

    let exec_event_address = `https://repository.dcrgraphs.net/api/graphs/${dcr_id}/`;
        
    req_instance.get(exec_event_address)
    .then(response => {
      // Parsing the XML of DCR model and extracting the roles
      xml2js.parseString(response.data, (err, result) => {
        if (err) {
          console.error('Failed to parse XML', err);
          return;
        }
        try {
          const roles = result.dcrgraph.specification[0].resources[0].custom[0].roles[0].role;
          const roleValues = roles.map(role => role._);
          console.log(roleValues);
        } catch (error) {
          console.error('Failed to extract roles', error);
        }
      });

    })
    .catch(error => {
        console.log("ERROR happened:");
        console.log(error);
    });

  });

}


getRolesDCR('1699207');

module.exports = {
    getRolesDCR,
};

