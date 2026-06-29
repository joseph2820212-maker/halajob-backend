import assert from "node:assert/strict";

import {
  buildIntegrationMongoHelp,
  createMemoryMongoHandle,
  IntegrationMongoServer,
  scopedConnectionUrl,
} from "./utils/integrationMongo.js";

const previousConnectionUrl = process.env.CONNECTION_URL;
const previousSystemBinary = process.env.MONGOMS_SYSTEM_BINARY;

try {
  assert.equal(
    scopedConnectionUrl("mongodb://127.0.0.1:27017/base?retryWrites=false", "halajob proof"),
    "mongodb://127.0.0.1:27017/halajob%20proof?retryWrites=false",
  );
  assert.equal(
    scopedConnectionUrl("mongodb://127.0.0.1:27017", "halajob-proof"),
    "mongodb://127.0.0.1:27017/halajob-proof",
  );

  process.env.CONNECTION_URL = "mongodb://localhost:27017/root?directConnection=true";
  const externalHandle = await IntegrationMongoServer.create({
    instance: { dbName: "halajob-helper-proof" },
  });
  assert.equal(
    externalHandle.getUri(),
    "mongodb://localhost:27017/halajob-helper-proof?directConnection=true",
  );
  await externalHandle.stop();

  delete process.env.CONNECTION_URL;
  delete process.env.MONGOMS_SYSTEM_BINARY;
  const expectedDownloadError = new Error("getaddrinfo ENOTFOUND fastdl.mongodb.org");
  await assert.rejects(
    () =>
      createMemoryMongoHandle(
        {},
        {
          async create() {
            throw expectedDownloadError;
          },
        },
      ),
    (error) => {
      assert.match(error.message, /Could not start mongodb-memory-server/);
      assert.match(error.message, /CONNECTION_URL/);
      assert.match(error.message, /MONGOMS_SYSTEM_BINARY/);
      assert.match(error.message, /MongoDB 7 service container/);
      assert.equal(error.cause, expectedDownloadError);
      return true;
    },
  );

  const help = buildIntegrationMongoHelp(new Error("binary missing"));
  assert.match(help, /Original error: binary missing/);

  console.log("Integration Mongo helper contract passed.");
} finally {
  if (previousConnectionUrl === undefined) {
    delete process.env.CONNECTION_URL;
  } else {
    process.env.CONNECTION_URL = previousConnectionUrl;
  }
  if (previousSystemBinary === undefined) {
    delete process.env.MONGOMS_SYSTEM_BINARY;
  } else {
    process.env.MONGOMS_SYSTEM_BINARY = previousSystemBinary;
  }
}
