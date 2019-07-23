# THE GOOD PARTY - API

[Sails v1](https://sailsjs.com) based node.js api for [The Good Party](https://thegoodparty.org/).

<img src="https://thegoodparty.org/assets/images/image04.svg" align="center"
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
or
```
yarn global add sails
```

Clone this repo

```
git clone https://github.com/thegoodparty/tgp-api.git
```

install dependencies

```
npm i
```
or
```
yarn
```

You will need to add a local file: config/local.js file (which is git-ignored):
```javascript
module.exports = {

  ADMIN_EMAILS: ['email@example.com'],
  MAILGUN_API: 'YOUR API KEY'

};

```

And now you are ready to start:
```
npm start
```
or
```
yarn start
```

For Dev Environment install Nodemon

```javascript
npm install -g nodemon
```
or

```javascript
yarn global add nodemon
```

and run:
```
npm run start-dev
```
or
```
yarn run start-dev
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
```

## Coding styles

We are using [conventional commits](https://www.conventionalcommits.org/)



### Links

+ [Sails framework documentation](https://sailsjs.com/get-started)
+ [Version notes / upgrading](https://sailsjs.com/documentation/upgrading)
+ [Deployment tips](https://sailsjs.com/documentation/concepts/deployment)
+ [Community support options](https://sailsjs.com/support)
+ [Professional / enterprise options](https://sailsjs.com/enterprise)



## License

This project is licensed under the [Creative Common Zero (CC0)](https://creativecommons.org/share-your-work/public-domain/cc0/) License

