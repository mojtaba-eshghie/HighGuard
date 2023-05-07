### CLawK: Runtime Monitoring of Smart Contracts Using to Dynamic Condition Response Specifications

The is still a work in progress. If you are interested in this project, contact me by email: eshghie@kth.se

### Installation

Run the `npm install` in the main repository directory and the following directories:

`server/monitor`

`client`

The system is tested with Node 16.17.0.

### Usage

Run the following commands (in order):

In **server**:

`npm start`
The server will ask for your DCRGraphs credentials the first time you run it. The credentials will be stored under `server/monitor/datastore/` directory as a sqlite database.

In **client**:

`npm start`
