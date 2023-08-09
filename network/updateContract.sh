export PATH=${PWD}/../bin:$PATH

# deploy chaincode; give a different version number after making changes
export CHANNEL_NAME=pharmachannel
export CC_NAME=pharmanet
export CC_SRC_PATH=../chaincode
export CC_RUNTIME_LANGUAGE=node
export CC_VERSION=1.5
export CC_SEQUENCE=6
export FABRIC_CFG_PATH=$PWD/../config/
peer lifecycle chaincode package ${CC_NAME}.tar.gz --path ${CC_SRC_PATH} --lang ${CC_RUNTIME_LANGUAGE} --label ${CC_NAME}_${CC_VERSION}

# deploy chaincode on consumer
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/msp/tlscacerts/tlsca.drugcounterfeit.com-cert.pem
export CORE_PEER_LOCALMSPID="consumerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/peers/peer0.consumer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/users/Admin@consumer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:7051
peer lifecycle chaincode install ${CC_NAME}.tar.gz

export CORE_PEER_ADDRESS=localhost:8051
peer lifecycle chaincode install ${CC_NAME}.tar.gz

# deploy chaincode on distributor
export CORE_PEER_LOCALMSPID="distributorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/distributor.drugcounterfeit.com/peers/peer0.distributor.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/distributor.drugcounterfeit.com/users/Admin@distributor.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:9051
peer lifecycle chaincode install ${CC_NAME}.tar.gz

export CORE_PEER_ADDRESS=localhost:10051
peer lifecycle chaincode install ${CC_NAME}.tar.gz

# deploy chaincode on manufacturer
export CORE_PEER_LOCALMSPID="manufacturerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/manufacturer.drugcounterfeit.com/peers/peer0.manufacturer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/manufacturer.drugcounterfeit.com/users/Admin@manufacturer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:11051
peer lifecycle chaincode install ${CC_NAME}.tar.gz

export CORE_PEER_ADDRESS=localhost:12051
peer lifecycle chaincode install ${CC_NAME}.tar.gz

# deploy chaincode on retailer
export CORE_PEER_LOCALMSPID="retailerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/retailer.drugcounterfeit.com/peers/peer0.retailer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/retailer.drugcounterfeit.com/users/Admin@retailer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:13051
peer lifecycle chaincode install ${CC_NAME}.tar.gz

export CORE_PEER_ADDRESS=localhost:14051
peer lifecycle chaincode install ${CC_NAME}.tar.gz

# deploy chaincode on transporter
export CORE_PEER_LOCALMSPID="transporterMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/transporter.drugcounterfeit.com/peers/peer0.transporter.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/transporter.drugcounterfeit.com/users/Admin@transporter.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:15051
peer lifecycle chaincode install ${CC_NAME}.tar.gz

export CORE_PEER_ADDRESS=localhost:16051
peer lifecycle chaincode install ${CC_NAME}.tar.gz