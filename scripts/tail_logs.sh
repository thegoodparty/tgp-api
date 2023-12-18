#!/bin/bash

# Validate the number of arguments passed to the script
if [ $# -lt 1 ]; then
    echo "Usage: $0 <env>"
    exit 1
fi

# Extract the first parameter (Environment: dev, etc.)
ENV=$1

# Validate the environment parameter
if [ "$ENV" == "dev" ]; then
    LOG_GROUP_NAME=$LOG_GROUP_DEV
elif [ "$ENV" == "qa" ]; then
    LOG_GROUP_NAME=$LOG_GROUP_QA
elif [ "$ENV" == "prod" ]; then
    LOG_GROUP_NAME=$LOG_GROUP_PROD
else
    echo "Invalid environment specified."
    exit 1
fi

# Initialize the command string
CMD="aws logs tail $LOG_GROUP_NAME --follow"

# Execute the AWS CLI command
echo "Executing: $CMD"
eval $CMD
