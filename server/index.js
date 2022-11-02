// server/index.js

const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();
const cors = require('cors');


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


app.get("/nodeapp", (req, res) => {
  console.log('react is connected..');
  res.json({ message: "Connected to nodejs!" });
});


app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
