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
        let msgSender = ctx.clientIdentity.getID();
        const drugKey = ctx.stub.createCompositeKey('pharmanet.drug', [drugName + '-' + serialNo]);

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
            manufacturer: msgSender,
            manufacturingDate: mfgDate,
            expiryDate: expDate, 
            owner: msgSender,
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

        let msgSenderMSP = ctx.clientIdentity.getMSPID();

        if(msgSenderMSP !== "distributorMSP" || msgSenderMSP !== "retailerMSP"){
            throw new Error('Only a Distributor or Retailer can create a Purchase Order');
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

    async createShipment(ctx, buyerCRN, drugName, listOfAssets, transporterCRN){

    }

    async updateShipment( buyerCRN, drugName, transporterCRN)
    async retailDrug (drugName, serialNo, retailerCRN, customerAadhar)
}

module.exports = PharmaContract;