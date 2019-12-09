#!/bin/bash

# Rest client mainly used for testing purposes.
# Queries the Truebit API that is exposed through the agent/compute_api.js server

##### ARGS ########
COMMAND=$1

######### OPTIONS ######################
INITIATE_AGENT="start"
SHOW_ACCOUNTS="accounts"
SKIP_BLOCKS="skip"
BALANCE="balance"
TASK_SUBMIT="submit"
REGISTER="register"
LIST_WORKERS="ps"
SELECT_SOLVER="select"
LIST_PROVIDER_TASKS="lstasks"
LIST_CLIENT_TASKS="cls"
###### SERVER CONFIGURATION ############
HOST="127.0.0.1"
PORT=9870
BASE_URL="http://$HOST:$PORT"
########################################

if [[ $COMMAND == $INITIATE_AGENT ]];
then
    ACCOUNT=$2
    AGENT_TYPE=$3 # task | solve | verify
    DATA="{\"account\":\"$ACCOUNT\",\"type\":\"$AGENT_TYPE\"}"
    curl -X POST -H "Content-Type: application/json" -d "$DATA" $BASE_URL/start
elif [[ $COMMAND == $SHOW_ACCOUNTS ]];
then
    curl -X GET $BASE_URL/accounts 
elif [[ $COMMAND == $SKIP_BLOCKS ]];
then
    curl -X GET $BASE_URL/skip
elif [[ $COMMAND == $BALANCE ]];
then
    ACCOUNT=$2
    curl -X GET $BASE_URL/balance/$ACCOUNT
elif [[ $COMMAND == $TASK_SUBMIT ]];
then
    COMPUTE_CONTRACT_ADDRESS=$2
    TASK_PATH=$3
    PROVIDER_URL=$4
    DATA="{\"address\":\"$COMPUTE_CONTRACT_ADDRESS\",\"path\":\"$TASK_PATH\",\"url\":\"$PROVIDER_URL\"}"
    curl -X POST -H "Content-Type: application/json" -d "$DATA" $BASE_URL/submit
elif [[ $COMMAND == $REGISTER ]];
then
    ACCOUNT=$2
    TASK_ID=$3
    DATA="{\"account\":\"$ACCOUNT\",\"task\":\"$TASK_ID\"}"
    curl -X POST -H "Content-Type: application/json" -d "$DATA" $BASE_URL/register
elif [[ $COMMAND == $LIST_WORKERS ]];
then
    curl -X GET $BASE_URL/ps 
elif [[ $COMMAND == $LIST_PROVIDER_TASKS ]];
then
    ACCOUNT=$2
    curl -X GET $BASE_URL/lstasks/$ACCOUNT
elif [[ $COMMAND == $LIST_CLIENT_TASKS ]];
then
    ACCOUNT=$2
    curl -X GET $BASE_URL/clientTasks/$ACCOUNT
elif [[ $COMMAND == $SELECT_SOLVER ]];
then
    ACCOUNT=$2
    TASK_ID=$3
    DATA="{\"account\":\"$ACCOUNT\",\"task\":\"$TASK_ID\"}"
    curl -X POST -H "Content-Type: application/json" -d "$DATA" $BASE_URL/select
fi



