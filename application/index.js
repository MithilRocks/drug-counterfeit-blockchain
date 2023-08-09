const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;

const main = require('./2_main.js');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('title', 'Drug Counterfeit App');

app.post('/registerCompany', (req, res) => {
    if(!Object.keys(req.body).length) {
        const result = {
            status: 'error',
            message: 'No body parameters found!'
        };
        res.status(400).send(result);
    } else if(!req.body.peer || !req.body.companyCrn || !req.body.companyName || !req.body.location || !req.body.organisationRole) {
        let result = {
            status: 'error',
            message: 'One of the following parameters is missing: peer, companyCrn, companyName, location, organisationRole'
        }
        res.status(400).send(result);
    } else {
        main.execute(
            'registerCompany', req.body.peer, 'pharmachannel', 'pharmanet', req.body.companyCrn, req.body.companyName, req.body.location, req.body.organisationRole
        ).then((company) => {
            console.log('New Company registered!');
            const result = {
                status: 'success',
                message: 'New Company registered!',
                company: company
            };
            res.json(result);
        }).catch((e) => {
            const result = {
                status: 'error',
                message: 'Failed', 
                error: e.responses[0].response.message
            };
            res.status(500).send(result);
        }).finally(() => {
            main.disconnect();
        });
    }
    
});

app.post('/addDrug', (req, res) => {
    if(!Object.keys(req.body).length) {
        const result = {
            status: 'error',
            message: 'No body parameters found!'
        };
        res.status(400).send(result);
    } else if(!req.body.peer || !req.body.drugName || !req.body.serialNo || !req.body.mfgDate || !req.body.expDate || !req.body.companyCrn || !req.body.companyName) {
        let result = {
            status: 'error',
            message: 'One of the following parameters is missing: peer, drugName, serialNo, mfgDate, expDate, companyCrn, companyName'
        }
        res.status(400).send(result);
    } else {
        main.execute(
            'addDrug', req.body.peer, 'pharmachannel', 'pharmanet', req.body.drugName, req.body.serialNo, req.body.mfgDate, req.body.expDate, req.body.companyCrn, req.body.companyName
        ).then((drug) => {
            console.log('New Drug Added!');
            const result = {
                status: 'success',
                message: 'New Drug Added!',
                drug: drug
            };
            res.json(result);
        }).catch((e) => {
            const result = {
                status: 'error',
                message: 'Failed', 
                error: e.responses[0].response.message
            };
            res.status(500).send(result);
        }).finally(() => {
            main.disconnect();
        });
    }
});

app.post('/createPO', (req, res) => {
    if(!Object.keys(req.body).length) {
        const result = {
            status: 'error',
            message: 'No body parameters found!'
        };
        res.status(400).send(result);
    } else if(!req.body.peer || !req.body.buyerCRN || !req.body.buyerName || !req.body.sellerCRN || !req.body.sellerName || !req.body.drugName || !req.body.quantity) {
        let result = {
            status: 'error',
            message: 'One of the following parameters is missing: peer, buyerCRN, buyerName, sellerCRN, sellerName, drugName, quantity'
        }
        res.status(400).send(result);
    } else {
        main.execute(
            'createPO', req.body.peer, 'pharmachannel', 'pharmanet', req.body.buyerCRN, req.body.buyerName, req.body.sellerCRN, req.body.sellerName, req.body.drugName, req.body.quantity
        ).then((po) => {
            console.log('Purchase Order Created Successfully!');
            const result = {
                status: 'success',
                message: 'Purchase Order Created Successfully!',
                po: po
            };
            res.json(result);
        }).catch((e) => {
            const result = {
                status: 'error',
                message: 'Failed', 
                error: e.responses[0].response.message
            };
            res.status(500).send(result);
        }).finally(() => {
            main.disconnect();
        });
    }
});

app.post('/createShipment', (req, res) => {
    // buyerCRN, buyerName, sellerCRN, drugName, listOfAssets, transporterCRN, transporterName
    if(!Object.keys(req.body).length) {
        const result = {
            status: 'error',
            message: 'No body parameters found!'
        };
        res.status(400).send(result);
    } else if(!req.body.peer || !req.body.buyerCRN || !req.body.buyerName || !req.body.sellerCRN || !req.body.drugName || !req.body.listOfAssets || !req.body.transporterCRN || !req.body.transporterName) {
        let result = {
            status: 'error',
            message: 'One of the following parameters is missing: peer, buyerCRN, buyerName, sellerCRN, drugName, listOfAssets, transporterCRN, transporterName'
        }
        res.status(400).send(result);
    } else {
        main.execute(
            'createShipment', req.body.peer, 'pharmachannel', 'pharmanet', req.body.buyerCRN, req.body.buyerName, req.body.sellerCRN, req.body.drugName, req.body.listOfAssets, req.body.transporterCRN, req.body.transporterName
        ).then((po) => {
            console.log('Shipment Created Successfully!');
            const result = {
                status: 'success',
                message: 'Shipment Created Successfully!',
                po: po
            };
            res.json(result);
        }).catch((e) => {
            const result = {
                status: 'error',
                message: 'Failed', 
                error: e.responses[0].response.message
            };
            res.status(500).send(result);
        }).finally(() => {
            main.disconnect();
        });
    }
});

app.post('/viewDrug', (req, res) => {
    if(!Object.keys(req.body).length) {
        const result = {
            status: 'error',
            message: 'No body parameters found!'
        };
        res.status(400).send(result);
    } else if(!req.body.peer || !req.body.drugName || !req.body.serialNo) {
        let result = {
            status: 'error',
            message: 'One of the following parameters is missing: peer, drugName, serialNo'
        }
        res.status(400).send(result);
    } else {
        main.execute(
            'viewDrugCurrentState', req.body.peer, 'pharmachannel', 'pharmanet', req.body.drugName, req.body.serialNo
        ).then((drug) => {
            console.log('Drug Info Fetched!');
            const result = {
                status: 'success',
                message: 'Drug Info Fetched!',
                drug: drug
            };
            res.json(result);
        }).catch((e) => {
            const result = {
                status: 'error',
                message: 'Failed', 
                error: e.responses[0].response.message
            };
            res.status(500).send(result);
        }).finally(() => {
            main.disconnect();
        });
    }
});

app.post('/viewHistory', (req, res) => {
    if(!Object.keys(req.body).length) {
        const result = {
            status: 'error',
            message: 'No body parameters found!'
        };
        res.status(400).send(result);
    } else if(!req.body.peer || !req.body.drugName || !req.body.serialNo) {
        let result = {
            status: 'error',
            message: 'One of the following parameters is missing: peer, drugName, serialNo'
        }
        res.status(400).send(result);
    } else {
        main.execute(
            'viewHistory', req.body.peer, 'pharmachannel', 'pharmanet', req.body.drugName, req.body.serialNo
        ).then((drugHistory) => {
            console.log('Drug History Fetched!');
            const result = {
                status: 'success',
                message: 'Drug History Fetched!',
                drugHistory: drugHistory
            };
            res.json(result);
        }).catch((e) => {
            const result = {
                status: 'error',
                message: 'Failed', 
                error: e.responses[0].response.message
            };
            res.status(500).send(result);
        }).finally(() => {
            main.disconnect();
        });
    }
});

app.listen(port, () => console.log(`Drug Counterfeit App listenig on port ${port}!`));