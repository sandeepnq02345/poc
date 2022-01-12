'use strict';

const config = require('../../config')();

module.exports = async () => {
  const databases = config.services.databases;
  const types = [];
  const connection = [];
  if (databases) {
    await Promise.all(databases.map(async database => {
      if (database.enable) {
        types.push(database.type);
        const connect = await database.connector();
        connection[database.type] = connect;
      }
    }));
    return { types, connection };
  } else {
    return {
      types: [],
      connection: []
    };
  }
};
