### CLawK: Monitoring Business Processes in Smart Contracts
CLawK: Acronym for Contract Law Keeper, read "clock".

Based on the following research paper:

[CLawK: Monitoring Business Processes in Smart Contracts](https://arxiv.org/abs/2305.08254)



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
