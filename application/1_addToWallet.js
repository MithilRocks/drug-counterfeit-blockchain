'use strict'

const fs = require('fs');
const {Wallets} = require('fabric-network');

async function main(certificatePath, keyfilePath){
    const wallet = await Wallets.newFileSystemWallet('./identity/transporter');
    const certificate = fs.readFileSync(certificatePath).toString();
    const privateKey = fs.readFileSync(keyfilePath).toString();
    const identity = {
        credentials: {
            certificate: certificate,
            privateKey: privateKey
        },
        mspId: 'transporterMSP',
        type: 'X.509'
    }

    await wallet.put('admin_transporter', identity);
    console.log('Successfully added identity to the wallet');
}

const certificatePath = '/Users/mithilbhoras/Documents/GitHub/drug-counterfeit-blockchain/network/organizations/peerOrganizations/transporter.drugcounterfeit.com/users/Admin@transporter.drugcounterfeit.com/msp/signcerts/Admin@transporter.drugcounterfeit.com-cert.pem';
const keyfilePath = '/Users/mithilbhoras/Documents/GitHub/drug-counterfeit-blockchain/network/organizations/peerOrganizations/transporter.drugcounterfeit.com/users/Admin@transporter.drugcounterfeit.com/msp/keystore/priv_sk';
main(certificatePath, keyfilePath);