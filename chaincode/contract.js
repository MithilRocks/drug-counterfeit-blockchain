'use strict';

const {Contract} = require('fabric-contract-api');

class PharmaContract extends Contract{
    
    constructor(){
        super();
    }

    async instantiate(ctx){
        console.log("Chaincode was successfully deployed");
    }

    /**
     * Use Case: This transaction/function will be used to register new entities on the ledger. 
     * For example, for “VG pharma” to become a distributor on the network, it must register itself on the ledger using this transaction.
     * 
     * @param ctx 
     * @param companyCRN 
     * @param companyName 
     * @param Location 
     * @param organisationRole 
     * @returns {Object}
     */

    async registerCompany(ctx, companyCRN, companyName, Location, organisationRole){

        const organizationKey = ctx.stub.createCompositeKey('pharmanet.organization', [companyCRN]);

        let newOrganizationObject = {
            companyId: organizationKey,
            name: companyName,
            location: Location,
            organisationRole: organisationRole
        }

        if(organisationRole == "Manufacturer"){
            newOrganizationObject.hierarchyKey = 1;
        } else if(organisationRole == "Distributor"){
            newOrganizationObject.hierarchyKey = 2;
        } else if(organisationRole == "Retailer"){
            newOrganizationObject.hierarchyKey = 3;
        }

        let dataBuffer = Buffer.from(JSON.stringify(newOrganizationObject));
		await ctx.stub.putState(organizationKey, dataBuffer);
		
		return newOrganizationObject;
    }

    /**
     * 
     * @param ctx 
     * @param drugName 
     * @param serialNo 
     * @param mfgDate 
     * @param expDate 
     * @param companyCRN
     * @returns {Object}
     */

    async addDrug(ctx, drugName, serialNo, mfgDate, expDate, companyCRN){
        let msgSenderMSP = ctx.clientIdentity.getMSPID();

        const drugKey = ctx.stub.createCompositeKey('pharmanet.drug', [drugName + '-' + serialNo]);
        const organizationKey = ctx.stub.createCompositeKey('pharmanet.organization', [companyCRN]);

        if(msgSenderMSP !== "manufacturerMSP"){
            throw new Error('Only a Manufacturer can add a new drug');
        }

        let drug = await ctx.stub.getState(drugKey).catch(err => console.log(err));

        if(drug.length !== 0){
            throw new Error('Drug ' + drugName + ' with serial no. ' + serialNo + ' already exists');
        }

        // look at shipment after working on updateShipment
        let newDrugObject = {
            productId: drugKey,
            name: drugName,
            manufacturer: organizationKey,
            manufacturingDate: mfgDate,
            expiryDate: expDate, 
            owner: organizationKey,
            shipment: []
        }

        let dataBuffer = Buffer.from(JSON.stringify(newDrugObject));
		await ctx.stub.putState(drugKey, dataBuffer);

        return newDrugObject;
    }

    /**
     * Use Case: This function is used to create a Purchase Order (PO) to buy drugs, 
     * by companies belonging to ‘Distributor’ or ‘Retailer’ organisation.
     * 
     * @param ctx 
     * @param buyerCRN 
     * @param sellerCRN 
     * @param drugName 
     * @param quantity 
     * @returns {Object} 
     */
    async createPO(ctx, buyerCRN, sellerCRN, drugName, quantity){
        // check if a distributor or retailer is initiating the purchase order
        let msgSenderMSP = ctx.clientIdentity.getMSPID();
        if(msgSenderMSP !== "distributorMSP" || msgSenderMSP !== "retailerMSP"){
            throw new Error('Only a Distributor or Retailer can create a Purchase Order');
        }

        // get buyer and seller info
        const buyerKey = ctx.stub.createCompositeKey('pharmanet.organization', [buyerCRN]);
        const sellerKey = ctx.stub.createCompositeKey('pharmanet.organization', [sellerCRN]);

        let buyerBuffer = await ctx.stub.getState(buyerKey).catch(err => console.log(err));
        let sellerBuffer = await ctx.stub.getState(sellerKey).catch(err => console.log(err));

        if(buyerBuffer.length === 0 ){
            throw new Error('Buyer with CRN ' + buyerCRN + ' doesn\'t exist.');
        }

        if(sellerBuffer.length === 0 ){
            throw new Error('Seller with CRN ' + sellerCRN + ' doesn\'t exist.');
        }

        const buyer = JSON.parse(buyerBuffer.toString());
        const seller = JSON.parse(sellerBuffer.toString());

        if(buyer.organisationRole !== seller.organisationRole - 1){
            throw new Error('The buyer does not have the autority to buy from the seller due to incorrect order of organizational roles.');
        }

        const poIDKey = ctx.stub.createCompositeKey('pharmanet.purchaseOrder', [buyerCRN + '-' + sellerCRN]);

        let purchaseOrderObject = {
            poID: poIDKey,
            drugName: drugName,
            quantity: quantity,
            buyer: buyerKey,
            seller: sellerKey
        }

        let dataBuffer = Buffer.from(JSON.stringify(purchaseOrderObject));
		await ctx.stub.putState(poIDKey, dataBuffer);

        return purchaseOrderObject;
    }

    /**
     * Use Case: After the buyer invokes the createPO transaction, the seller invokes this 
     * transaction to transport the consignment via a transporter corresponding to each PO.
     * 
     * @param ctx 
     * @param buyerCRN 
     * @param sellerCRN
     * @param drugName 
     * @param listOfAssets 
     * @param transporterCRN 
     * @returns {Object}
     */
    async createShipment(ctx, buyerCRN, sellerCRN, drugName, listOfAssets, transporterCRN){
        // check if a distributor or retailer is initiating the purchase order
        let msgSenderMSP = ctx.clientIdentity.getMSPID();
        if(msgSenderMSP !== "distributorMSP" || msgSenderMSP !== "manufacturerMSP"){
            throw new Error('Error Creating Shipment. Only a Distributor or Manufacturer can create a shipment');
        }

        let creator = ctx.clientIdentity.getID();

        const poIDKey = ctx.stub.createCompositeKey('pharmanet.purchaseOrder', [buyerCRN + '-' + sellerCRN]);       
        let poBuffer = await ctx.stub.getState(poIDKey).catch(err => console.log(err));

        if(poBuffer.length === 0){
            throw new Error('Error Creating Shipment. Purchase order between Buyer(CRN: ' + buyerCRN + ') and Seller(CRN: ' + sellerCRN + ') doesn\'t exist.');
        }

        const purchaseOrder = JSON.parse(poBuffer.toString());

        if(listOfAssets.length !== purchaseOrder.quantity){
            throw new Error('Error Creating Shipment. List of Assets doesn\'t match Purchase Order quantity.');
        }

        let assets = [];

        //check if assets are valid
        listOfAssets.forEach(async (assetID) => {
            let drugKey = ctx.stub.createCompositeKey('pharmanet.drug', [drugName + '-' + assetID]);
            assets.push(drugKey);

            let drugBuffer = await ctx.stub.getState(drugKey).catch(err => console.log(err));
            
            if(drugBuffer.length === 0){
                throw new Error('Error Creating Shipment. Asset with ID ' + assetID + ' doesn\'t exist for Drug ' + drugName);
            }
        });

        const shipmentKey = ctx.stub.createCompositeKey('pharmanet.shipment', [buyerCRN + '-' + drugName]);
        const transporterKey = ctx.stub.createCompositeKey('pharmanet.organization', [transporterCRN]);
        const buyerKey = ctx.stub.createCompositeKey('pharmanet.organization', [buyerCRN]);

        let shipmentObject = {
            shipmentID: shipmentKey,
            creator: creator,
            assets: assets,
            transporter: transporterKey,
            status: 'In-Transit'
        }
        
        let dataBuffer = Buffer.from(JSON.stringify(shipmentObject));
		await ctx.stub.putState(shipmentKey, dataBuffer);

        //update owner of each asset
        assets.forEach(async (asset) => {
            let drugBuffer = await ctx.stub.getState(asset).catch(err => console.log(err));

            if(drugBuffer.length === 0){
                throw new Error('Error Creating Shipment. Asset with ID ' + asset + ' doesn\'t exist for Drug ' + drugName);
            }

            let drug = JSON.parse(drugBuffer.toString());
            drug.owner = buyerKey;

            let dataBuffer = Buffer.from(JSON.stringify(drug));
		    await ctx.stub.putState(asset, dataBuffer);
        });

        return shipmentObject;
    }

    /**
     * Use Case: This transaction is used to update the status of the shipment to ‘Delivered’ when the consignment gets delivered to the destination.
     * 
     * @param ctx 
     * @param buyerCRN 
     * @param drugName 
     * @param transporterCRN 
     * @returns {Object}
     */
    async updateShipment(ctx, buyerCRN, drugName, transporterCRN){
        let msgSenderMSP = ctx.clientIdentity.getMSPID();
        if(msgSenderMSP !== "transporterMSP"){
            throw new Error('Only a Transporter can Update Shipment.');
        }

        const shipmentKey = ctx.stub.createCompositeKey('pharmanet.shipment', [buyerCRN + '-' + drugName]);
        const transporterKey = ctx.stub.createCompositeKey('pharmanet.organization', [transporterCRN]);

        let shipmentBuffer = await ctx.stub.getState(shipmentKey).catch(err => console.log(err));

        if(shipmentBuffer.length === 0){
            throw new Error('Error Updating Shipment. Shipment by Buyer(CRN: ' + buyerCRN + ') for Drug ' + drugName + ' not found.');
        }

        const shipment = JSON.parse(shipmentBuffer.toString());

        if(shipment.transporter !== transporterKey){
            throw new Error('Only the Transporter of this Shipment can Update this Shipment.');
        }

        // update status of shipment
        shipment.status = 'Delivered';  
        let dataBuffer = Buffer.from(JSON.stringify(shipment));
		await ctx.stub.putState(shipmentKey, dataBuffer);

        // add to shipment list of every consignment
        shipment.assets.forEach(async (assetKey) => {
            let drugBuffer = await ctx.stub.getState(assetKey).catch(err => console.log(err));
            
            if(drugBuffer.length === 0){
                throw new Error('Error Updating Shipment. Drug ' + drugName + ' not found.');
            }

            let drug = JSON.parse(drugBuffer.toString());
            let shipmentList = drug.shipment
            drug.shipment = shipmentList.push(shipmentKey);

            let dataBuffer = Buffer.from(JSON.stringify(drug));
		    await ctx.stub.putState(asset, dataBuffer);
        });
        
        return shipment;
    }

    /**
     * 
     * @param ctx 
     * @param drugName 
     * @param serialNo 
     * @param retailerCRN 
     * @param customerAadhar 
     * @returns {Object}
     */
    async retailDrug(ctx, drugName, serialNo, retailerCRN, customerAadhar){
        let msgSenderMSP = ctx.clientIdentity.getMSPID();
        if(msgSenderMSP !== "retailerMSP"){
            throw new Error('Only a Retailer can sell the Drug to the Customer.');
        }

        const retailerKey = ctx.stub.createCompositeKey('pharmanet.organization', [retailerCRN]);
        let retailerBuffer = await ctx.stub.getState(retailerKey).catch(err => console.log(err));
        if(retailerBuffer.length === 0){
            throw new Error('Error selling drug. Retailer(CRN:' + retailerCRN + ') does not exist.');
        }

        const drugKey = ctx.stub.createCompositeKey('pharmanet.drug', [drugName + '-' + serialNo]);
        let drugBuffer = await ctx.stub.getState(drugKey).catch(err => console.log(err));
        if(drugBuffer.length === 0){
            throw new Error('Error selling drug. Drug ' + drugName + ' does not exist.');
        }
        const drug = JSON.parse(retailerBuffer.toString());

        if(drug.owner === retailerKey){
            drug.owner = customerAadhar;
            let dataBuffer = Buffer.from(JSON.stringify(drug));
		    await ctx.stub.putState(drugKey, dataBuffer);
            return drug;
        } else {
            throw new Error('Error selling drug. Retailer(CRN:' + retailerCRN + ') is not the owner of the drug.')
        }
    }
}

module.exports = PharmaContract;