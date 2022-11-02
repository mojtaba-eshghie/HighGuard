const axios = require('axios');

/*
async function fetchAPI(address, params) {
    const response = await fetch(address);
    const data = await response.json();
    console.log(data);
  }
//console.log('777777');
result = fetchAPI(LOGIN_ADDRESS, null);
console.log(result);
*/

async function fetch_api(address, params) {
  let req_instance = axios.create({
    headers: {
      Authorization: 'Basic ZXNoZ2hpZUBrdGguc2U6RXNoZ2hhbVhvZGFzdFRhMTAwMFNhbA=='
      }
    })

  req_instance.get(address)
    .then(response => {
      //console.log(response);
      //console.log(response.data.url);
      console.log(response.data);
    })
    .catch(error => {
      console.log(error);
    });
}

//fetch_api('https://repository.dcrgraphs.net/api/graphs/1327657/sims')


// https://repository.dcrgraphs.net/api/graphs/id/sims/simid/events
fetch_api('https://repository.dcrgraphs.net/api/graphs/1327657/sims/1472419/events')