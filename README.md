# THE GOOD PARTY - API

[Sails v1](https://sailsjs.com) based node.js api for [The Good Party](https://thegoodparty.org/).

<img src="https://assets.goodparty.org/share.jpg" align="center"
     title="The Good Party" width="100%">

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

[Node.js](https://nodejs.org/en/)
[Postgres](https://www.enterprisedb.com/)

### Installing

Here are the steps to get started:

```
npm install sails -g
```

Clone this repo

```
git clone https://github.com/thegoodparty/tgp-api.git
```

install dependencies

```
npm i
```


You will need to add a local file: config/local.js file (which is git-ignored):

```javascript
module.exports = {
  ADMIN_EMAILS: ['email@example.com'],
  MAILGUN_API: 'YOUR API KEY',
};
```

And now you are ready to start:

```
npm start
```


For Dev Environment install Nodemon

```javascript
npm install -g nodemon
```



and run:

```
npm run dev
```


### Running the tests

We are using jest for unit test

```
npm run test
```

## Preparing for production:

Setup the following ENV varialbles:

```
sails_datastores__default__url: 'postgres connection url', //https://sailsjs.com/documentation/reference/configuration/sails-config-datastores
sails_custom__adminEmails: ['example@gmail.com'] // array of emails for admin permission
sails_custom__jwt_secret: 'jwt secret key' // array of emails for admin permission
sails_custom__twilioSID: 'Twilio SID'
sails_custom__twilioAuthToken: 'Twilio Secret Auth Token'
sails_custom__twilioVerification: 'Twilio Verification ID'
sails_custom__contentfulSpaceId: 'Contentful Space Id'
sails_custom__contentfulAccessToken: 'Conteful Access Token'
```

## Coding styles

We are using [conventional commits](https://www.conventionalcommits.org/)

### Copy Table in pgAdmin

```
1) In pgAdmin, right click the table you want to move, select "Backup"
2) Pick the directory for the output file and set Format to "plain"
3) Click the "Dump Options #1" tab, check "Only data" or "only Schema" (depending on what you are doing)
4) Under the Queries section, click "Use Column Inserts" and "User Insert Commands".
5) Click the "Backup" button. This outputs to a .backup file
6) Open this new file using notepad. You will see the insert scripts needed for the table/data. Copy and paste these into the new database sql page in pgAdmin. Run as pgScript - Query->Execute as pgScript F6
```

### Seed Order

```
1) seed.js (districts) /api/v1/seed/seed
2) seed-presidential /api/v1/seed/seed-presidential
3) seed-races-combined /api/v1/seed/seed-races-combined
4) seed-incumbents (adds data to incumbents from opensecrets) /api/v1/seed/seed-incumbents
5) seed-ballotpedia /api/v1/seed/seed-ballotpedia
6) seed-ballotpedia with not data (second run) - /api/v1/seed/seed-ballotpedia?secondPass=true
7) seed-ballotpedia manual match (third run) - /api/v1/seed/seed-ballotpedia?manualResults=true
```

### Links

- [Sails framework documentation](https://sailsjs.com/get-started)
- [Version notes / upgrading](https://sailsjs.com/documentation/upgrading)
- [Deployment tips](https://sailsjs.com/documentation/concepts/deployment)
- [Community support options](https://sailsjs.com/support)
- [Professional / enterprise options](https://sailsjs.com/enterprise)

## License

This project is licensed under the [Creative Common Zero (CC0)](https://creativecommons.org/share-your-work/public-domain/cc0/) License
