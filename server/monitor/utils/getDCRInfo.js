const axios = require('axios');
let getBasicAuth = require('./get-basic-auth');
let scutil = require('./scutil');
const xml2js = require('xml2js');

let getDCRRoles = (dcrID) => {
  return getBasicAuth().then(basic_authorization => {
    let req_instance = axios.create({
      headers: {
        Authorization: basic_authorization
      }
    });

    let dcrModelURL = `https://repository.dcrgraphs.net/api/graphs/${dcrID}/`;

    return req_instance.get(dcrModelURL)
    .then(response => {
      // Parsing the XML of DCR model and extracting the roles
      return new Promise((resolve, reject) => {
        xml2js.parseString(response.data, (err, result) => {
          if (err) {
            console.error('Failed to parse XML', err);
            reject(err);
            return;
          }
          try {
            const roles = result.dcrgraph.specification[0].resources[0].custom[0].roles[0].role;
            const roleValues = roles.map(role => role._);
            resolve(roleValues);
          } catch (error) {
            console.error('Failed to extract roles', error);
            reject(error);
          }
        });
      });
    })
    .catch(error => {
      console.log("ERROR happened:");
      console.log(error);
      return -1;
    });
  });
}

let getDCRActivities = (dcrID) => {
  return getBasicAuth().then(basic_authorization => {
    let req_instance = axios.create({
      headers: {
        Authorization: basic_authorization
      }
    });

    let dcrModelURL = `https://repository.dcrgraphs.net/api/graphs/${dcrID}/`;
    return req_instance.get(dcrModelURL)
    .then(response => {
      // Parsing the XML of DCR model and extracting the activities
      return new Promise((resolve, reject) => {
        xml2js.parseString(response.data, (err, result) => {
          if (err) {
            console.error('Failed to parse XML', err);
            reject(err);
            return;
          }
          try {
            const events = result.dcrgraph.specification[0].resources[0].events[0].event;
            const eventIds = events.map(event => event.$.id);
            resolve(eventIds);
          } catch (error) {
            console.error('Failed to extract event IDs', error);
            reject(error);
          }
        });        
      });
    })
    .catch(error => {
      console.log("ERROR happened:");
      console.log(error);
      return -1;
    });
  });
}

let getSimulationXML = (dcrID, simID) => {
  return getBasicAuth().then(basic_authorization => {
    let req_instance = axios.create({
      headers: {
        Authorization: basic_authorization
      }
    });

    let simulationURL = `https://repository.dcrgraphs.net/api/graphs/${dcrID}/sims/${simID}`;
    return req_instance.get(simulationURL)
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.log("ERROR happened:");
      console.log(error);
      return -1;
    });
  });
} 

module.exports = {
  getDCRRoles,
  getDCRActivities,
  getSimulationXML
};

