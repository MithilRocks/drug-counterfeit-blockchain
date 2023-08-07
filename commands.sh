cd ..
cd ..
export PATH=${PWD}/../bin:$PATH
cryptogen generate --config=./organizations/cryptogen/crypto-config-orderer.yaml --output="organizations"
cryptogen generate --config=./organizations/cryptogen/crypto-config-consumer.yaml --output="organizations"
cryptogen generate --config=./organizations/cryptogen/crypto-config-distributor.yaml --output="organizations"
cryptogen generate --config=./organizations/cryptogen/crypto-config-manufacturer.yaml --output="organizations"
cryptogen generate --config=./organizations/cryptogen/crypto-config-retailer.yaml --output="organizations"
cryptogen generate --config=./organizations/cryptogen/crypto-config-transporter.yaml --output="organizations"

export FABRIC_CFG_PATH=${PWD}/configtx
configtxgen -profile DrugCounterfeitOrdererGenesis -channelID system-channel -outputBlock ./system-genesis-block/genesis.block

export IMAGE_TAG=latest
docker-compose -f docker/docker-compose-pharmachannel.yaml -f docker/docker-compose-ca.yaml up -d
docker ps -a

configtxgen -profile DrugCounterfeitChannel -outputCreateChannelTx ./channel-artifacts/pharmachannel.tx -channelID pharmachannel

export CORE_PEER_TLS_ENABLED=true
export FABRIC_CFG_PATH=$PWD/../config/
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/msp/tlscacerts/tlsca.drugcounterfeit.com-cert.pem
export CORE_PEER_LOCALMSPID="consumerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/peers/peer0.consumer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/users/Admin@consumer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:7051
peer channel create -o localhost:7050 -c pharmachannel --ordererTLSHostnameOverride orderer.drugcounterfeit.com -f ./channel-artifacts/pharmachannel.tx --outputBlock "./channel-artifacts/pharmachannel.block" --tls --cafile $ORDERER_CA

export BLOCKFILE="./channel-artifacts/pharmachannel.block"
peer channel join -b $BLOCKFILE

# --- NEW COMMANDS ---
export PATH=${PWD}/../bin:$PATH

export FABRIC_CFG_PATH=${PWD}/configtx
configtxgen -profile DrugCounterfeitOrdererGenesis -channelID pharmachannel -outputBlock ./channel-artifacts/pharmachannel.block

export FABRIC_CFG_PATH=$PWD/../config/
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/msp/tlscacerts/tlsca.drugcounterfeit.com-cert.pem
export ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/tls/server.crt
export ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/tls/server.key
osnadmin channel join --channelID pharmachannel  --config-block ./channel-artifacts/pharmachannel.block -o localhost:7053 --ca-file $ORDERER_CA --client-cert $ADMIN_TLS_SIGN_CERT --client-key $ADMIN_TLS_PRIVATE_KEY

export CORE_PEER_LOCALMSPID="consumerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/peers/peer0.consumer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/users/Admin@consumer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export BLOCKFILE="./channel-artifacts/pharmachannel.block"
peer channel join -b $BLOCKFILE