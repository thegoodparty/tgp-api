#!/usr/bin/env bash

# Note: This script is executed by the platform hooks system. It is not executed in the context of the application.
# The environment variables are loaded in /etc/profile.d/sh.local, which is sourced by the application user's shell.
# Which is loaded by the .ebextensions/load-env.config file.

# Loading environment data
EB_APP_USER=$(/opt/elasticbeanstalk/bin/get-config platformconfig -k AppUser)
EB_APP_CURRENT_DIR=$(/opt/elasticbeanstalk/bin/get-config platformconfig -k AppDeployDir)

 # Now we can execute the command. The -l flag sources makes sure to source everything in /etc/profile.d/
 # We start these as background processes so they dont hang the deployment
su -l ${EB_APP_USER} -c "cd $EB_APP_CURRENT_DIR; npx sails run start-consumer.js &"
su -l ${EB_APP_USER} -c "cd $EB_APP_CURRENT_DIR; npx sails run start-consumer.js &"
su -l ${EB_APP_USER} -c "cd $EB_APP_CURRENT_DIR; npx sails run start-consumer.js &"
su -l ${EB_APP_USER} -c "cd $EB_APP_CURRENT_DIR; npx sails run start-consumer.js &"