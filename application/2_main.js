'use strict'

const helper = require('./contractHelper.js');

/**
 * Call any function from smart contract
 * 
 * @param functonName
 * @param peerCompany 
 * @param channelName 
 * @param channelId 
 * @param  {...any} args //arguments to pass to the smart contract function
 * @returns 
 */
async function main(functonName, peerCompany, channelName, channelId, ...args){
    const contract = await helper.getContractInstance(peerCompany, channelName, channelId);
    const responseBuffer = await contract.submitTransaction(functonName, ...args);
    const response = JSON.parse(responseBuffer.toString());    
    return response;
}

module.exports.execute = main;
module.exports.disconnect = helper.disconnect;