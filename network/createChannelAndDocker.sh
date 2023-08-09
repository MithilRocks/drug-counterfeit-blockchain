export PATH=${PWD}/../bin:$PATH

# create genesis block
export FABRIC_CFG_PATH=${PWD}/configtx
configtxgen -profile DrugCounterfeitOrdererGenesis -channelID pharmachannel -outputBlock ./channel-artifacts/pharmachannel.block

# create docker containers
export IMAGE_TAG=latest
docker-compose -f docker/docker-compose-pharmachannel.yaml -f docker/docker-compose-ca.yaml up -d
docker ps -a

export CORE_PEER_TLS_ENABLED=true
export FABRIC_CFG_PATH=$PWD/../config/
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/msp/tlscacerts/tlsca.drugcounterfeit.com-cert.pem
export ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/tls/server.crt
export ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/tls/server.key
osnadmin channel join --channelID pharmachannel  --config-block ./channel-artifacts/pharmachannel.block -o localhost:7053 --ca-file $ORDERER_CA --client-cert $ADMIN_TLS_SIGN_CERT --client-key $ADMIN_TLS_PRIVATE_KEY

# make consumer peers join the channel
export CORE_PEER_LOCALMSPID="consumerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/peers/peer0.consumer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/users/Admin@consumer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export BLOCKFILE="./channel-artifacts/pharmachannel.block"
peer channel join -b $BLOCKFILE

export CORE_PEER_ADDRESS=localhost:8051
peer channel join -b $BLOCKFILE

# make distributor peers join the channel
export CORE_PEER_LOCALMSPID="distributorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/distributor.drugcounterfeit.com/peers/peer0.distributor.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/distributor.drugcounterfeit.com/users/Admin@distributor.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:9051
peer channel join -b $BLOCKFILE

export CORE_PEER_ADDRESS=localhost:10051
peer channel join -b $BLOCKFILE

# make manufacturer peers join the channel
export CORE_PEER_LOCALMSPID="manufacturerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/manufacturer.drugcounterfeit.com/peers/peer0.manufacturer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/manufacturer.drugcounterfeit.com/users/Admin@manufacturer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:11051
peer channel join -b $BLOCKFILE

export CORE_PEER_ADDRESS=localhost:12051
peer channel join -b $BLOCKFILE

# make retailer peers join the channel
export CORE_PEER_LOCALMSPID="retailerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/retailer.drugcounterfeit.com/peers/peer0.retailer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/retailer.drugcounterfeit.com/users/Admin@retailer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:13051
peer channel join -b $BLOCKFILE

export CORE_PEER_ADDRESS=localhost:14051
peer channel join -b $BLOCKFILE

# make transporter peers join the channel
export CORE_PEER_LOCALMSPID="transporterMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/transporter.drugcounterfeit.com/peers/peer0.transporter.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/transporter.drugcounterfeit.com/users/Admin@transporter.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=localhost:15051
peer channel join -b $BLOCKFILE

export CORE_PEER_ADDRESS=localhost:16051
peer channel join -b $BLOCKFILE

# go into cli terminal
docker exec -it cli /bin/bash 

# add peer0 of consumer as anchor
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/msp/tlscacerts/tlsca.drugcounterfeit.com-cert.pem
export CORE_PEER_LOCALMSPID="consumerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/peers/peer0.consumer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/consumer.drugcounterfeit.com/users/Admin@consumer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=peer0.consumer.drugcounterfeit.com:7051
peer channel fetch config config_block.pb -o orderer.drugcounterfeit.com:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com -c pharmachannel --tls --cafile $ORDERER_CA

configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config >"${CORE_PEER_LOCALMSPID}config.json"
export HOST="peer0.consumer.drugcounterfeit.com"
export PORT=7051
jq '.channel_group.groups.Application.groups.'${CORE_PEER_LOCALMSPID}'.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "'$HOST'","port": '$PORT'}]},"version": "0"}}' ${CORE_PEER_LOCALMSPID}config.json > ${CORE_PEER_LOCALMSPID}modified_config.json

configtxlator proto_encode --input "${CORE_PEER_LOCALMSPID}config.json" --type common.Config >original_config.pb
configtxlator proto_encode --input "${CORE_PEER_LOCALMSPID}modified_config.json" --type common.Config >modified_config.pb
configtxlator compute_update --channel_id "pharmachannel" --original original_config.pb --updated modified_config.pb >config_update.pb
configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate >config_update.json
echo '{"payload":{"header":{"channel_header":{"channel_id":"pharmachannel", "type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . >config_update_in_envelope.json
configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope >"${CORE_PEER_LOCALMSPID}anchors.tx"

peer channel update -o orderer.drugcounterfeit.com:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com -c pharmachannel -f ${CORE_PEER_LOCALMSPID}anchors.tx --tls --cafile $ORDERER_CA

# add peer0 of distributor as anchor
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/msp/tlscacerts/tlsca.drugcounterfeit.com-cert.pem
export CORE_PEER_LOCALMSPID="distributorMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/distributor.drugcounterfeit.com/peers/peer0.distributor.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/distributor.drugcounterfeit.com/users/Admin@distributor.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=peer0.distributor.drugcounterfeit.com:9051
peer channel fetch config config_block.pb -o orderer.drugcounterfeit.com:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com -c pharmachannel --tls --cafile $ORDERER_CA

configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config >"${CORE_PEER_LOCALMSPID}config.json"
export HOST="peer0.distributor.drugcounterfeit.com"
export PORT=9051
jq '.channel_group.groups.Application.groups.'${CORE_PEER_LOCALMSPID}'.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "'$HOST'","port": '$PORT'}]},"version": "0"}}' ${CORE_PEER_LOCALMSPID}config.json > ${CORE_PEER_LOCALMSPID}modified_config.json

configtxlator proto_encode --input "${CORE_PEER_LOCALMSPID}config.json" --type common.Config >original_config.pb
configtxlator proto_encode --input "${CORE_PEER_LOCALMSPID}modified_config.json" --type common.Config >modified_config.pb
configtxlator compute_update --channel_id "pharmachannel" --original original_config.pb --updated modified_config.pb >config_update.pb
configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate >config_update.json
echo '{"payload":{"header":{"channel_header":{"channel_id":"pharmachannel", "type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . >config_update_in_envelope.json
configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope >"${CORE_PEER_LOCALMSPID}anchors.tx"

peer channel update -o orderer.drugcounterfeit.com:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com -c pharmachannel -f ${CORE_PEER_LOCALMSPID}anchors.tx --tls --cafile $ORDERER_CA

# add peer0 of manufacturer as anchor
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/msp/tlscacerts/tlsca.drugcounterfeit.com-cert.pem
export CORE_PEER_LOCALMSPID="manufacturerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/manufacturer.drugcounterfeit.com/peers/peer0.manufacturer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/manufacturer.drugcounterfeit.com/users/Admin@manufacturer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=peer0.manufacturer.drugcounterfeit.com:11051
peer channel fetch config config_block.pb -o orderer.drugcounterfeit.com:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com -c pharmachannel --tls --cafile $ORDERER_CA

configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config >"${CORE_PEER_LOCALMSPID}config.json"
export HOST="peer0.manufacturer.drugcounterfeit.com"
export PORT=11051
jq '.channel_group.groups.Application.groups.'${CORE_PEER_LOCALMSPID}'.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "'$HOST'","port": '$PORT'}]},"version": "0"}}' ${CORE_PEER_LOCALMSPID}config.json > ${CORE_PEER_LOCALMSPID}modified_config.json

configtxlator proto_encode --input "${CORE_PEER_LOCALMSPID}config.json" --type common.Config >original_config.pb
configtxlator proto_encode --input "${CORE_PEER_LOCALMSPID}modified_config.json" --type common.Config >modified_config.pb
configtxlator compute_update --channel_id "pharmachannel" --original original_config.pb --updated modified_config.pb >config_update.pb
configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate >config_update.json
echo '{"payload":{"header":{"channel_header":{"channel_id":"pharmachannel", "type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . >config_update_in_envelope.json
configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope >"${CORE_PEER_LOCALMSPID}anchors.tx"

peer channel update -o orderer.drugcounterfeit.com:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com -c pharmachannel -f ${CORE_PEER_LOCALMSPID}anchors.tx --tls --cafile $ORDERER_CA

# add peer0 of retailer as anchor
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/msp/tlscacerts/tlsca.drugcounterfeit.com-cert.pem
export CORE_PEER_LOCALMSPID="retailerMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/retailer.drugcounterfeit.com/peers/peer0.retailer.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/retailer.drugcounterfeit.com/users/Admin@retailer.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=peer0.retailer.drugcounterfeit.com:13051
peer channel fetch config config_block.pb -o orderer.drugcounterfeit.com:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com -c pharmachannel --tls --cafile $ORDERER_CA

configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config >"${CORE_PEER_LOCALMSPID}config.json"
export HOST="peer0.retailer.drugcounterfeit.com"
export PORT=13051
jq '.channel_group.groups.Application.groups.'${CORE_PEER_LOCALMSPID}'.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "'$HOST'","port": '$PORT'}]},"version": "0"}}' ${CORE_PEER_LOCALMSPID}config.json > ${CORE_PEER_LOCALMSPID}modified_config.json

configtxlator proto_encode --input "${CORE_PEER_LOCALMSPID}config.json" --type common.Config >original_config.pb
configtxlator proto_encode --input "${CORE_PEER_LOCALMSPID}modified_config.json" --type common.Config >modified_config.pb
configtxlator compute_update --channel_id "pharmachannel" --original original_config.pb --updated modified_config.pb >config_update.pb
configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate >config_update.json
echo '{"payload":{"header":{"channel_header":{"channel_id":"pharmachannel", "type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . >config_update_in_envelope.json
configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope >"${CORE_PEER_LOCALMSPID}anchors.tx"

peer channel update -o orderer.drugcounterfeit.com:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com -c pharmachannel -f ${CORE_PEER_LOCALMSPID}anchors.tx --tls --cafile $ORDERER_CA

# add peer0 of transporter as anchor
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/drugcounterfeit.com/orderers/orderer.drugcounterfeit.com/msp/tlscacerts/tlsca.drugcounterfeit.com-cert.pem
export CORE_PEER_LOCALMSPID="transporterMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/transporter.drugcounterfeit.com/peers/peer0.transporter.drugcounterfeit.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/transporter.drugcounterfeit.com/users/Admin@transporter.drugcounterfeit.com/msp
export CORE_PEER_ADDRESS=peer0.transporter.drugcounterfeit.com:15051
peer channel fetch config config_block.pb -o orderer.drugcounterfeit.com:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com -c pharmachannel --tls --cafile $ORDERER_CA

configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config >"${CORE_PEER_LOCALMSPID}config.json"
export HOST="peer0.transporter.drugcounterfeit.com"
export PORT=15051
jq '.channel_group.groups.Application.groups.'${CORE_PEER_LOCALMSPID}'.values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "'$HOST'","port": '$PORT'}]},"version": "0"}}' ${CORE_PEER_LOCALMSPID}config.json > ${CORE_PEER_LOCALMSPID}modified_config.json

configtxlator proto_encode --input "${CORE_PEER_LOCALMSPID}config.json" --type common.Config >original_config.pb
configtxlator proto_encode --input "${CORE_PEER_LOCALMSPID}modified_config.json" --type common.Config >modified_config.pb
configtxlator compute_update --channel_id "pharmachannel" --original original_config.pb --updated modified_config.pb >config_update.pb
configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate >config_update.json
echo '{"payload":{"header":{"channel_header":{"channel_id":"pharmachannel", "type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . >config_update_in_envelope.json
configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope >"${CORE_PEER_LOCALMSPID}anchors.tx"

peer channel update -o orderer.drugcounterfeit.com:7050 --ordererTLSHostnameOverride orderer.drugcounterfeit.com -c pharmachannel -f ${CORE_PEER_LOCALMSPID}anchors.tx --tls --cafile $ORDERER_CA