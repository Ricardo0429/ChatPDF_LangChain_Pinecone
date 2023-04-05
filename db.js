const mongodb = require("mongodb");
const connectionUrl = process.env.DB_URL;

const MongoClient = new mongodb.MongoClient(connectionUrl, {
  useNewUrlParser: true,
});

// const db;

const init = async () => {
  await MongoClient.connect((error, client) => {
    if (error) {
      return console.log("Unable to connect to database");
    }
  });
  console.log("connected successfully ---------------");
};

const insertItem = (item) => {
  const collection = MongoClient.db(process.env.DB_NAME).collection("items");
  // client.find({});
  return collection.insertOne({ item });
};

module.exports = {
  init,
  insertItem,
};
