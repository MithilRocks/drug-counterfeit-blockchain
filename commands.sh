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
docker-compose -f docker/docker-compose-certnet.yaml -f docker/docker-compose-ca.yaml up -d
docker ps -a

configtxgen -profile DrugCounterfeitChannel -outputCreateChannelTx ./channel-artifacts/certnet.tx -channelID certnet

export CORE_PEER_TLS_ENABLED=true
export FABRIC_CFG_PATH=$PWD/../config/
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/msp/tlscacerts/tlsca.drugcounterfeit.com-cert.pem
export CORE_PEER_LOCALMSPID="consumerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/peers/peer0.consumer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/users/Admin@consumer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:7051
peer channel create -o localhost:7050 -c certnet --ordererTLSHostnameOverride orderer.drugcounterfeit.com -f ./channel-artifacts/certnet.tx --outputBlock "./channel-artifacts/certnet.block" --tls --cafile $ORDERER_CA

export BLOCKFILE="./channel-artifacts/certnet.block"
peer channel join -b $BLOCKFILE