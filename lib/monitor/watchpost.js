/**
 * Watchpost Module
 * 
 * Just as a watchtower oversees a landscape to identify and report significant events, the "watchpost" 
 * continuously scans and filters transactions within blocks, singling out the relevant ones for further 
 * processing or action. 
 */

require('module-alias/register');
let WaitQueue = require('wait-queue');
const Web3 = require("web3");
const fs = require('fs');
const path = require('path');
let { getContractABI } = require('@lib/deploy');

// params: web3, 



let watchTransactions = (monitorQueue, web3, contractAddress, contractFileName, paramaps) => {
    
    web3.eth.subscribe('newBlockHeaders', (error, header) => {
    if (error) {
    console.error(error);
    return;
    }
  
      // Get the block object for the current header
      web3.eth.getBlock(header.number, true, (error, block) => {
        if (error) {
          console.error(error);
          return;
        }
  
        // Iterate over all transactions in the block
        block.transactions.forEach((tx) => {            
            // Check if the transaction involves the specified contract contractAddress
            if (tx.to && tx.to.toLowerCase() === contractAddress.toLowerCase()) {
            let dcrEvents = getDCREvents(tx);
                if (dcrEvents) {
                    monitorQueue.push(dcrEvents);
                }
            }
        });
  
      });
    });
  
    return monitorQueue;
}
  
  
