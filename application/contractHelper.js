'use strict'

const fs = require('fs');
const {Wallets, Gateway} = require('fabric-network');
const yaml = require('js-yaml');
let gateway;

async function getContractInstance(peerType, channelName, chainCodeId){
    gateway = new Gateway();
    const connectionprofile = yaml.load(fs.readFileSync('./connection-' + peerType + '.yaml', 'utf8'));
    const wallet = await Wallets.newFileSystemWallet('./identity/' + peerType);
    const gatewayoptions = {
        wallet: wallet,
        identity: 'admin_' + peerType,
        discovery: { enabled: true, asLocalhost: true }
    }
    await gateway.connect(connectionprofile, gatewayoptions);
    const channel = await gateway.getNetwork(channelName);
    return await channel.getContract(chainCodeId, '');
}

function disconnect(){
    gateway.disconnect();
}

module.exports.getContractInstance = getContractInstance;
module.exports.disconnect = disconnect;