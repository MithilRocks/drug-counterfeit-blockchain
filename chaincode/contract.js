'use strict';

const {Contract} = require('fabric-contract-api');

class PharmaContract extends Contract{
    
    constructor(){
        super();
    }

    async instantiate(ctx){
        console.log("Chaincode was successfully deployed");
    }

    async registerCompany (ctx, companyCRN, companyName, Location, organisationRole){

        const organisationKey = ctx.stub.createCompositeKey('org.certification-network.certnet.student', [companyCRN + '-' + companyName]);

        let newOrganizationObject = {
            companyId: companyCRN,
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
		await ctx.stub.putState(organisationKey, dataBuffer);
		
        // Return value of new certificate issued to student
		return newOrganizationObject;
        
    }
}

module.exports = PharmaContract;