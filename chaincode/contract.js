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

        // access to all but the consumer
        let msgSenderMSP = ctx.clientIdentity.getMSPID();
        if(msgSenderMSP == "consumerMSP"){
            throw new Error('Consumer cannot register a company.');
        }

        // only peers whose msp matches with the organisation they are trying to register 
        // are allowed to invoke this function
        if(msgSenderMSP !== organisationRole + "MSP"){
            throw new Error('Your organisation is a ' + msgSenderMSP.replace('MSP', '') + '; you cannot register this company.');
        }

        //check if company already exists
        const organizationKey = ctx.stub.createCompositeKey('pharmanet.organization', [companyCRN + '-' + companyName]);
        let company = await ctx.stub.getState(organizationKey).catch(err => console.log(err));
        if(company.length !== 0){
            throw new Error('Company ' + companyName + ' with CRN ' + companyCRN + ' already exists');
        }

        let newOrganizationObject = {
            companyId: organizationKey,
            name: companyName,
            location: Location,
            organisationRole: organisationRole
        }

        if(organisationRole == "manufacturer"){
            newOrganizationObject.hierarchyKey = 1;
        } else if(organisationRole == "distributor"){
            newOrganizationObject.hierarchyKey = 2;
        } else if(organisationRole == "retailer"){
            newOrganizationObject.hierarchyKey = 3;
        } else if(organisationRole !== "transporter"){
            throw new Error('Incorrect Organisation Role provided.');
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
    async addDrug(ctx, drugName, serialNo, mfgDate, expDate, companyCRN, companyName){
        let msgSenderMSP = ctx.clientIdentity.getMSPID();
        if(msgSenderMSP !== "manufacturerMSP"){
            throw new Error('Only a Manufacturer can add a new drug');
        }

        const drugKey = ctx.stub.createCompositeKey('pharmanet.drug', [drugName + '-' + serialNo]);
        const organizationKey = ctx.stub.createCompositeKey('pharmanet.organization', [companyCRN + '-' + companyName]);

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
     * @param buyerName
     * @param sellerCRN
     * @param sellerName  
     * @param drugName 
     * @param quantity 
     * @returns {Object} 
     */
    async createPO(ctx, buyerCRN, buyerName, sellerCRN, sellerName, drugName, quantity){
        // check if a distributor or retailer is initiating the purchase order
        let msgSenderMSP = ctx.clientIdentity.getMSPID();
        if(msgSenderMSP !== "distributorMSP" && msgSenderMSP !== "retailerMSP"){
            throw new Error('Only a Distributor or Retailer can create a Purchase Order');
        }

        // get buyer and seller info
        const buyerKey = ctx.stub.createCompositeKey('pharmanet.organization', [buyerCRN + '-' + buyerName]);
        const sellerKey = ctx.stub.createCompositeKey('pharmanet.organization', [sellerCRN + '-' + sellerName]);

        let buyerBuffer = await ctx.stub.getState(buyerKey).catch(err => console.log(err));
        let sellerBuffer = await ctx.stub.getState(sellerKey).catch(err => console.log(err));

        if(buyerBuffer.length === 0 ){
            throw new Error('Buyer ' + buyerName + 'with CRN ' + buyerCRN + ' doesn\'t exist.');
        }

        if(sellerBuffer.length === 0 ){
            throw new Error('Seller ' + sellerName + 'with CRN ' + sellerCRN + ' doesn\'t exist.');
        }

        const buyer = JSON.parse(buyerBuffer.toString());
        const seller = JSON.parse(sellerBuffer.toString());

        if(buyer.hierarchyKey - seller.hierarchyKey !== 1){
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
     * @param transporterName
     * @returns {Object}
     */
    async createShipment(ctx, buyerCRN, buyerName, sellerCRN, drugName, listOfAssets, transporterCRN, transporterName){
        // check if a distributor or manufacturer is initiating the purchase order
        let msgSenderMSP = ctx.clientIdentity.getMSPID();
        if(msgSenderMSP !== "distributorMSP" && msgSenderMSP !== "manufacturerMSP"){
            throw new Error('Error Creating Shipment. Only a Distributor or Manufacturer can create a shipment');
        }

        let creator = ctx.clientIdentity.getID();

        const poIDKey = ctx.stub.createCompositeKey('pharmanet.purchaseOrder', [buyerCRN + '-' + sellerCRN]);       
        let poBuffer = await ctx.stub.getState(poIDKey).catch(err => console.log(err));

        if(poBuffer.length === 0){
            throw new Error('Error Creating Shipment. Purchase order between Buyer(CRN: ' + buyerCRN + ') and Seller(CRN: ' + sellerCRN + ') doesn\'t exist.');
        }

        const purchaseOrder = JSON.parse(poBuffer.toString());

        const listOfAssetsArr = listOfAssets.split(',')
        if(listOfAssetsArr.length != parseInt(purchaseOrder.quantity)){
            throw new Error('Error Creating Shipment. Quantity of Assets (' + listOfAssetsArr.length + ') doesn\'t match Purchase Order quantity (' + purchaseOrder.quantity + ')');
        }

        let assets = [];

        //check if assets are valid
        for(let assetID of listOfAssetsArr){
            const drugKey = ctx.stub.createCompositeKey('pharmanet.drug', [drugName + '-' + assetID]);
            let drugBuffer = await ctx.stub.getState(drugKey).catch(err => console.log(err));
            assets.push(drugKey);
            
            // check if drug exists
            if(drugBuffer.length === 0){
                throw new Error('Error Creating Shipment. Asset with ID ' + assetID + ' doesn\'t exist for Drug ' + drugName);
            }
        }

        const shipmentKey = ctx.stub.createCompositeKey('pharmanet.shipment', [buyerCRN + '-' + drugName]);
        const transporterKey = ctx.stub.createCompositeKey('pharmanet.organization', [transporterCRN + '-' + transporterName]);
        const buyerKey = ctx.stub.createCompositeKey('pharmanet.organization', [buyerCRN + '-' + buyerName]);

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
            let drug = JSON.parse(drugBuffer.toString());

            // set owner of drug
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
    async updateShipment(ctx, buyerCRN, drugName, transporterCRN, transporterName){
        let msgSenderMSP = ctx.clientIdentity.getMSPID();
        if(msgSenderMSP !== "transporterMSP"){
            throw new Error('Only a Transporter can Update Shipment.');
        }

        const shipmentKey = ctx.stub.createCompositeKey('pharmanet.shipment', [buyerCRN + '-' + drugName]);
        const transporterKey = ctx.stub.createCompositeKey('pharmanet.organization', [transporterCRN + '-' + transporterName]);

        let shipmentBuffer = await ctx.stub.getState(shipmentKey).catch(err => console.log(err));

        if(shipmentBuffer.length === 0){
            throw new Error('Error Updating Shipment. Shipment by Buyer(CRN: ' + buyerCRN + ') for Drug ' + drugName + ' not found.');
        }

        const shipment = JSON.parse(shipmentBuffer.toString());

        if(shipment.transporter !== transporterKey){
            throw new Error('Only the Transporter of this Shipment can Update this Shipment.');
        }

        // add to shipment list of every consignment
        shipment.assets.forEach(async (assetKey) => {
            let drugBuffer = await ctx.stub.getState(assetKey).catch(err => console.log(err));
            let drug = JSON.parse(drugBuffer.toString());
            let shipmentList = drug.shipment

            //update shipment list
            drug.shipment = shipmentList.push(shipmentKey);

            let dataBuffer = Buffer.from(JSON.stringify(drug));
		    await ctx.stub.putState(asset, dataBuffer);
        });

        // update status of shipment
        shipment.status = 'Delivered';  
        let dataBuffer = Buffer.from(JSON.stringify(shipment));
		await ctx.stub.putState(shipmentKey, dataBuffer);
        
        return shipment;
    }

    /**
     * This transaction is called by the retailer while selling the drug to a consumer. 
     * 
     * @param ctx 
     * @param drugName 
     * @param serialNo 
     * @param retailerCRN 
     * @param retailerName 
     * @param customerAadhar 
     * @returns {Object}
     */
    async retailDrug(ctx, drugName, serialNo, retailerCRN, retailerName, customerAadhar){
        let msgSenderMSP = ctx.clientIdentity.getMSPID();
        if(msgSenderMSP !== "retailerMSP"){
            throw new Error('Only a Retailer can sell the Drug to the Customer.');
        }

        const retailerKey = ctx.stub.createCompositeKey('pharmanet.organization', [retailerCRN + '-' + retailerName]);
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

    /**
     * Get history of an asset from database
     * 
     * @param ctx 
     * @param drugName 
     * @param serialNo 
     * @returns 
     */
    async viewHistory(ctx, drugName, serialNo){
        const drugKey = ctx.stub.createCompositeKey('pharmanet.drug', [drugName + '-' +serialNo]);
        let drugBuffer = await ctx.stub.getState(drugKey).catch(err => console.log(err));

        // check if drug exists
        if(drugBuffer.length === 0){
            throw new Error('Drug ' + drugName + ' with serial no. ' + serialNo + ' does not exist.');
        }

        // get history
        let drugHistoryIterator = await ctx.stub.getGetHistoryForKey(drugKey).catch(err => console.log(err));
        return await this.iterateResults(drugHistoryIterator);
    }

    /**
     * This transaction is used to view the current state of the Asset.
     * 
     * @param ctx 
     * @param drugName 
     * @param serialNo 
     * @returns {Object}
     */
    async viewDrugCurrentState(ctx, drugName, serialNo){
        const drugKey = ctx.stub.createCompositeKey('pharmanet.drug', [drugName + '-' +serialNo]);
        let drugBuffer = await ctx.stub.getState(drugKey).catch(err => console.log(err));

        // check if drug exists
        if(drugBuffer.length === 0){
            throw new Error('Drug ' + drugName + ' with serial no. ' + serialNo + ' does not exist.');
        }

        return JSON.parse(drugBuffer.toString());
    }

    /**
	 * Iterate through the StateQueryIterator object and return an array of all values contained in it
	 * @param iterator
	 * @returns {Promise<[JSON]>}
	 * [] {Key:, Value:} [{}], {Key:, Value:} [{},{}] [{},{},{},{}]
	 */
	async iterateResults(iterator) {
		let allResults = [];
		while (true) {
			let res = await iterator.next();

			if (res.value && res.value.value.toString()) {
				let jsonRes = {};
				console.log(res.value.value.toString());
				jsonRes.Key = res.value.key;
				try {
					jsonRes.Record = JSON.parse(res.value.value.toString());
				} catch (err) {
					console.log(err);
					jsonRes.Record = res.value.value.toString();
				}
				allResults.push(jsonRes);
			}
			if (res.done) {
				console.log('end of data');
				await iterator.close();
				console.info(allResults);
				return allResults;
			}
		}
	}
}

module.exports = PharmaContract;