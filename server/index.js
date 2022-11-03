// server/index.js

const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();
const cors = require('cors');
const axios = require('axios');
const parser = require('xml2json');


let req_instance = axios.create({
  headers: {
    Authorization: 'Basic ZXNoZ2hpZUBrdGguc2U6RXNoZ2hhbVhvZGFzdFRhMTAwMFNhbA=='
  }
})


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "YOUR-DOMAIN.TLD"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(cors());

app.get("/api", (req, res) => {
  res.json({ message: "Hi from the server..." });
  console.log('just handled a get api request...');
});

app.get('/api/listsims', (req, res) => {
  //console.log(req.query.dcrID);

  console.log(`https://repository.dcrgraphs.net/api/graphs/${req.query.dcrID}/sims/`);

  req_instance.get(`https://repository.dcrgraphs.net/api/graphs/${req.query.dcrID}/sims/`)
  .then(response => {
    

    let data = JSON.parse(parser.toJson(response.data))
    let result_array = [];
    data.log.trace.map((item, index) => {
      result_array.push({
        'id': item['id'],
        'title': item['title'],
        'modified': item['modified']
      })
    })

    res.json({ message: result_array});
  })
  
})


app.get("/nodeapp", (req, res) => {
  console.log('react is connected..');
  res.json({ message: "Connected to nodejs!" });
});


app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
