import { connect, set } from "mongoose";

import { NODE_ENV, DB_HOST, DB_PORT, DB_DATABASE } from "../config"

const dbConnection = async () => {
  const dbConfing = {
    url: `mongodb://${DB_HOST}:${DB_PORT}`,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  };

  if (NODE_ENV !== 'production') {
    set('debug', true);
  }

  await connect(dbConfing.url, { dbName: DB_DATABASE });
};

export default dbConnection;
