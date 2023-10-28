require('module-alias/register');
const axios = require('axios');
const xml2js = require('xml2js');
let unsafeAuth = require('@lib/auth/unsafe-authenticate');

/**
 * Fetches and returns roles of a DCR model from a specified DCR graph ID.
 *
 * @param {String} dcrID - The ID of the DCR graph.
 * @returns {Promise<Array<String>>} - A promise that resolves to an array of role names.
 */
let getRoles = (dcrID) => {
  return unsafeAuth().then(basicAuthorization => {
    let reqInstance = axios.create({
      headers: {
        Authorization: basicAuthorization
      }
    });

    let dcrModelURL = `https://repository.dcrgraphs.net/api/graphs/${dcrID}/`;

    return reqInstance.get(dcrModelURL)
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
            //reject(error);
            resolve([]);
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

/**
 * Fetches and returns all activities of a DCR model from a specified DCR graph ID.
 *
 * @param {String} dcrID - The ID of the DCR graph.
 * @returns {Promise<Array<String>>} - A promise that resolves to an array of activity IDs.
 */
let getActivities = (dcrID) => {
  return unsafeAuth().then(basicAuthorization => {
    let reqInstance = axios.create({
      headers: {
        Authorization: basicAuthorization
      }
    });

    let dcrModelURL = `https://repository.dcrgraphs.net/api/graphs/${dcrID}/`;
    return reqInstance.get(dcrModelURL)
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

/**
 * Fetches and returns the XML representation of a simulation from specified DCR graph and simulation IDs.
 *
 * @param {String} dcrID - The ID of the DCR graph.
 * @param {String} simID - The ID of the simulation.
 * @returns {Promise<String>} - A promise that resolves to the XML representation of the simulation.
 */
let getSimulationXML = (dcrID, simID) => {
  return unsafeAuth().then(basicAuthorization => {
    let reqInstance = axios.create({
      headers: {
        Authorization: basicAuthorization
      }
    });

    let simulationURL = `https://repository.dcrgraphs.net/api/graphs/${dcrID}/sims/${simID}`;
    return reqInstance.get(simulationURL)
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

/**
 * Fetches and returns all simulations in XML format from a specified DCR graph ID.
 *
 * @param {String} dcrID - The ID of the DCR graph.
 * @returns {Promise<String>} - A promise that resolves to the XML representation of all simulations.
 */
let getSimulations = (dcrID) => {
  return unsafeAuth().then(basicAuthorization => {
    let reqInstance = axios.create({
      headers: {
        Authorization: basicAuthorization
      }
    });

    let simulationURL = `https://repository.dcrgraphs.net/api/graphs/${dcrID}/sims/`;
    return reqInstance.get(simulationURL)
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

/**
 * Fetches all simulations and returns the ID of the last simulation from a specified DCR graph ID.
 *
 * @param {String} dcrID - The ID of the DCR graph.
 * @returns {Promise<String>} - A promise that resolves to the ID of the last simulation.
 */
let getLastSimulationId = (dcrID) => {
  return getSimulations(dcrID).then(simulations => {
    return new Promise((resolve, reject) => {
      xml2js.parseString(simulations, (err, result) => {
        if (err) {
          console.error('Failed to parse XML', err);
          reject(err);
          return;
        }
        try {
          // Extracting trace elements from the XML
          const traces = result.log.trace;
          // Getting the id attribute of the last trace element
          const lastSimulationId = traces[traces.length - 1].$.id;
          resolve(lastSimulationId);
        } catch (error) {
          console.error('Failed to extract last simulation ID', error);
          reject(error);
        }
      });
    });
  });
};


module.exports = {
  getRoles,
  getActivities,
  getSimulationXML,
  getSimulations,
  getLastSimulationId
};