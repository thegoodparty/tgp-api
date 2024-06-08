const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Capitalize the first letter of the string
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// Map Sails.js/Waterline data types to Prisma data types
const typeMap = {
  string: 'String',
  text: 'String',
  integer: 'Int',
  float: 'Float @db.Real',
  json: 'Json',
  boolean: 'Boolean',
  date: 'DateTime',
  datetime: 'DateTime',
  ref: 'Int', // Assuming ref is used for foreign keys
};

// Function to parse a single model file
const parseModel = (filePath) => {
  delete require.cache[require.resolve(filePath)];
  const model = require(filePath);
  const attributes = model.attributes || {};
  const fields = [];
  const m2mRelations = [];

  // Add the auto-incrementing id field
  fields.push('  id Int @id @default(autoincrement())');
  // Add createdAt and updatedAt fields
  fields.push('  createdAt BigInt?');
  fields.push('  updatedAt BigInt?');

  for (const [name, attr] of Object.entries(attributes)) {
    if (attr.model) {
      fields.push(`  ${name} Int`);
    } else if (attr.collection && attr.via) {
      m2mRelations.push({
        model: model.identity || path.basename(filePath, '.js'),
        name,
        collection: attr.collection,
        via: attr.via,
      });
    } else {
      const type = typeMap[attr.type] || 'String';
      const unique = attr.unique ? ' @unique' : '';
      const nullable = attr.required ? '' : '?';
      const fieldType =
        type === 'Json' && !attr.required
          ? `${type}? @db.Json`
          : type + nullable + (type === 'Json' ? ' @db.Json' : '');

      fields.push(`  ${name} ${fieldType}${unique}`);
    }
  }

  return {
    model: capitalize(model.identity || path.basename(filePath, '.js')),
    fields,
    m2mRelations,
  };
};

// Check if both sides of the relationship have the 'via' attribute
const hasBothSidesVia = (models, leftModel, leftField, rightModel) => {
  const leftModelFile = models.find(
    (model) => model.model.toLowerCase() === leftModel.toLowerCase(),
  );
  const rightModelFile = models.find(
    (model) => model.model.toLowerCase() === rightModel.toLowerCase(),
  );

  if (!leftModelFile || !rightModelFile) {
    return false;
  }

  const leftAttribute = leftModelFile.m2mRelations.find(
    (relation) =>
      relation.name === leftField &&
      relation.collection.toLowerCase() === rightModel.toLowerCase(),
  );

  const rightAttribute = rightModelFile.m2mRelations.find(
    (relation) => relation.collection.toLowerCase() === leftModel.toLowerCase(),
  );

  return leftAttribute && rightAttribute;
};

// Generate Prisma schema
const generatePrismaSchema = (models) => {
  let schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

  const m2mModels = new Set();
  const createdRelationships = new Set();

  models.forEach(({ model, fields, m2mRelations }) => {
    schema += `model ${model} {
${fields.join('\n')}
}
`;

    m2mRelations.forEach(({ model, name, collection, via }) => {
      const m2mModelName = `${model}_${name}__${capitalize(collection)}_${via}`;
      const reverseM2mModelName = `${capitalize(
        collection,
      )}_${via}__${model}_${name}`;

      if (
        !createdRelationships.has(reverseM2mModelName) &&
        hasBothSidesVia(models, model, name, collection)
      ) {
        m2mModels.add({
          name: m2mModelName,
          leftField: `${model.toLowerCase()}_${name.toLowerCase()}`,
          rightField: `${collection.toLowerCase()}_${via.toLowerCase()}`,
        });
        createdRelationships.add(m2mModelName);
      }
    });
  });

  // Create only necessary join tables
  m2mModels.forEach(({ name, leftField, rightField }) => {
    schema += `model ${name} {
  id Int @id @default(autoincrement())
  ${leftField} Int
  ${rightField} Int
  @@index([${leftField}, ${rightField}])
}
`;
  });

  return schema;
};

module.exports = {
  friendlyName: 'Generate prisma schema',

  description: 'Scans sails.js models and generates schema.prisma',

  inputs: {},

  exits: {},

  fn: async function (inputs, exits) {
    // Parse all models and generate the schema

    const modelsDir = path.join(__dirname, '../api', 'models');
    const modelFiles = glob.sync(path.join(modelsDir, '*/*.js'));

    // Convert Waterline models to Prisma schema
    const convertWaterlineToPrisma = (prismaFile) => {
      const models = modelFiles.map(parseModel);

      const prismaSchema = generatePrismaSchema(models);
      fs.writeFileSync(prismaFile, prismaSchema);
    };

    const prismaFile = './scripts/schema.prisma';
    convertWaterlineToPrisma(prismaFile);

    console.log('Prisma schema generated successfully.');
  },
};
