#!/bin/bash

# Validate the number of arguments passed to the script
if [ $# -lt 2 ]; then
    echo "Usage: $0 <env> <filter_pattern> [time]"
    exit 1
fi

# Extract the first parameter (Environment: dev, etc.)
ENV=$1

# Extract the second parameter (FILTER PATTERN)
FILTER_PATTERN=$2

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
CMD="aws logs filter-log-events --log-group-name $LOG_GROUP_NAME --filter-pattern '$FILTER_PATTERN'"

# If a third parameter exists, calculate the start time accordingly
if [ -n "$3" ]; then
    TIME_OPTION=$3
    TIME_UNIT=${TIME_OPTION: -1}
    TIME_VALUE=${TIME_OPTION%?}

    echo "Time option: $TIME_OPTION. Time unit: $TIME_UNIT. Time value: $TIME_VALUE."

    # Determine the time unit (hour or day)
    case "$TIME_UNIT" in
        h)
            # Calculate start time in milliseconds
            START_TIME=$(date -v-"$TIME_VALUE"H +%s)000
            ;;
        d)
            # Calculate start time in milliseconds
            START_TIME=$(date -v-"$TIME_VALUE"d +%s)000
            ;;
        *)
            echo "Invalid time option. Use 'h' for hours and 'd' for days. Example: 1h, 2d."
            exit 1
            ;;
    esac

    # Append the start time to the command string
    CMD="$CMD --start-time $START_TIME"
fi

# Execute the AWS CLI command
echo "Executing: $CMD"
eval $CMD
