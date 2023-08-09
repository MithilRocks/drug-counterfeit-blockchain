# ---Approval of chaincode---
# peer lifecycle chaincode queryinstalled
# export PACKAGE_ID="<copy package ID from above command's response>"

export CHANNEL_NAME=pharmachannel
export CC_NAME=pharmanet
export CC_SRC_PATH=../chaincode
export CC_RUNTIME_LANGUAGE=node
export CC_VERSION=1.5
export CC_SEQUENCE=6
export FABRIC_CFG_PATH=$PWD/../config/

export CORE_PEER_LOCALMSPID="consumerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/peers/peer0.consumer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/users/Admin@consumer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:7051
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com --tls --cafile $ORDERER_CA --channelID pharmachannel --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

export CORE_PEER_LOCALMSPID="distributorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/distributor.drugcounterfeit.com/peers/peer0.distributor.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/distributor.drugcounterfeit.com/users/Admin@distributor.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:9051
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com --tls --cafile $ORDERER_CA --channelID pharmachannel --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

export CORE_PEER_LOCALMSPID="manufacturerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/manufacturer.drugcounterfeit.com/peers/peer0.manufacturer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/manufacturer.drugcounterfeit.com/users/Admin@manufacturer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:11051
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com --tls --cafile $ORDERER_CA --channelID pharmachannel --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

export CORE_PEER_LOCALMSPID="retailerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/retailer.drugcounterfeit.com/peers/peer0.retailer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/retailer.drugcounterfeit.com/users/Admin@retailer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:13051
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com --tls --cafile $ORDERER_CA --channelID pharmachannel --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

export CORE_PEER_LOCALMSPID="transporterMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/transporter.drugcounterfeit.com/peers/peer0.transporter.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/transporter.drugcounterfeit.com/users/Admin@transporter.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:15051
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com --tls --cafile $ORDERER_CA --channelID pharmachannel --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE}

peer lifecycle chaincode checkcommitreadiness --channelID pharmachannel --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --output json

# commit chaincode
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com --tls --cafile $ORDERER_CA --channelID pharmachannel --name ${CC_NAME} --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/peers/peer0.consumer.drugcounterfeit.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/distributor.drugcounterfeit.com/peers/peer0.distributor.drugcounterfeit.com/tls/ca.crt --peerAddresses localhost:11051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/manufacturer.drugcounterfeit.com/peers/peer0.manufacturer.drugcounterfeit.com/tls/ca.crt --peerAddresses localhost:13051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/retailer.drugcounterfeit.com/peers/peer0.retailer.drugcounterfeit.com/tls/ca.crt --peerAddresses localhost:15051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/transporter.drugcounterfeit.com/peers/peer0.transporter.drugcounterfeit.com/tls/ca.crt --version ${CC_VERSION} --sequence ${CC_SEQUENCE}

peer lifecycle chaincode querycommitted --channelID pharmachannel --name ${CC_NAME}