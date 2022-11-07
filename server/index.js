// server/index.js

const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();
const cors = require('cors');
const axios = require('axios');
const parser = require('xml2json');
let monitor = require('./monitor/index');

const { Server } = require('ws');

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

  if (req.query.dcrID != 0) {

    console.log(`https://repository.dcrgraphs.net/api/graphs/${req.query.dcrID}/sims/`);

    req_instance.get(`https://repository.dcrgraphs.net/api/graphs/${req.query.dcrID}/sims/`)
    .then(response => {
      

      let data = JSON.parse(parser.toJson(response.data))
      let result_array = [];
      data.log.trace.map((item, index) => {
        //console.log(item['init']);
        result_array.push({
          'id': item['id'],
          'title': item['title'],
          'initialized': item['init']
        })
      })

      res.json({ message: result_array});
      
    })

  } else {
    console.log('No dcrID supplied! Aborting the request!')
  }
  
})


app.get("/nodeapp", (req, res) => {
  console.log('react is connected..');
  res.json({ message: "Connected to nodejs!" });
});




// run the rest api server
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});





app.post("/startmonitor", (req, res) => {
  
  res.json({ message: "Connected to nodejs!" });
});




// create the websocket server companion
const ws_server = new Server({ server: app, port:4000 });

ws_server.on('connection', (ws) => {
  console.log('New client connected!');
  ws.on('message', (message) => {
    //console.log(message.split('@')[3]);
    
    let monitor_results_queue = monitor(message.split('@')[2], parseInt(message.split('@')[0]), parseInt(message.split('@')[1]), message.split('@')[3]);

    let run = () => {
      monitor_results_queue.shift().then( (event) => {
        console.log('an event came!');
          ws_server.clients.forEach((client) => {
            console.log(`Sending event: ${event} to the client`);
            client.send(event);
          });
          setImmediate(run);
      });
      
    }
    run();
    
    
  })
  ws.on('close', () => console.log('Client has disconnected!'));
});

/*

let monitor_results_queue = monitor('0x76845822857079df6447767AAcC7753D62E0d245', 1327657, 1472502, 'sample');

let run = () => {
    monitor_results_queue.shift().then( (event) => {
      console.log('an event came!');
        ws_server.clients.forEach((client) => {
          console.log(`Sending event: ${event} to the client`);
          client.send(event);
        });
        setImmediate(run);
    });
  }
run();
*/

/*
// send data to client at fixed intervals!
setInterval(() => {
  ws_server.clients.forEach((client) => {
    console.log('sending.... the date and time!');
    client.send(new Date().toTimeString());
  });
}, 1000);
*/
