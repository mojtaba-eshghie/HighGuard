const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../datastore/monitor.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS MonitoringSession (
    sessionID INTEGER PRIMARY KEY AUTOINCREMENT,
    startTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    simulationXMLAtStart TEXT NOT NULL,
    simID TEXT NOT NULL,
    dcrID TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Events (
    eventID INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionID INTEGER,
    eventName TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    attributes TEXT,
    isExecutableInModel BOOLEAN,
    RBACJSON TEXT,
    FOREIGN KEY (sessionID) REFERENCES MonitoringSession(sessionID)
  )`);
});

function createMonitoringSession(simulationXMLAtStart, dcrID, simID, callback) {
  const query = `INSERT INTO MonitoringSession (simulationXMLAtStart, dcrID, simID) VALUES (?, ?, ?)`;
  db.run(query, [simulationXMLAtStart, dcrID, simID], function(err) {
    callback(err, this.lastID);
  });
}

function createEvent(sessionID, eventName, attributes, isExecutableInModel, RBACJSON, callback) {
  const query = `INSERT INTO Events (sessionID, eventName, attributes, isExecutableInModel, RBACJSON) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [sessionID, eventName, attributes, isExecutableInModel, RBACJSON], function(err) {
    callback(err, this.lastID);
  });
}

function getMonitoringSessionById(sessionID, callback) {
  const query = `SELECT * FROM MonitoringSession WHERE sessionID = ?`;
  db.get(query, [sessionID], function(err, row) {
    callback(err, row);
  });
}

function getAllMonitoringSessions(callback) {
  const query = `SELECT * FROM MonitoringSession`;
  db.all(query, [], function(err, rows) {
    callback(err, rows);
  });
}

function getEventsBySessionId(sessionID, callback) {
  const query = `SELECT * FROM Events WHERE sessionID = ?`;
  db.all(query, [sessionID], function(err, rows) {
    callback(err, rows);
  });
}



module.exports = {
  createMonitoringSession,
  createEvent,
  getMonitoringSessionById,
  getAllMonitoringSessions,
  getEventsBySessionId,
};
