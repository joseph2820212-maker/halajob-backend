import { MongoMemoryServer } from "mongodb-memory-server";
import { existsSync } from "node:fs";

const token = () => new Date().toISOString().replace(/[-:.TZ]/g, "");
const CONNECTION_URL_ENV = "CONNECTION_URL";
const SYSTEM_BINARY_ENV = "MONGOMS_SYSTEM_BINARY";

export function scopedConnectionUrl(rawUrl, dbName) {
  try {
    const url = new URL(rawUrl);
    url.pathname = `/${encodeURIComponent(dbName)}`;
    return url.toString();
  } catch {
    const [withoutQuery, query = ""] = String(rawUrl).split("?");
    const base = withoutQuery.replace(/\/[^/]*$/, "");
    return `${base}/${encodeURIComponent(dbName)}${query ? `?${query}` : ""}`;
  }
}

function dbNameFromOptions(options = {}) {
  const configured = String(options?.instance?.dbName || "").trim();
  return configured || `halajob-integration-${token()}`;
}

export function buildIntegrationMongoHelp(error) {
  const originalMessage = error?.message || String(error);
  return [
    "[integration-mongo] Could not start mongodb-memory-server.",
    "",
    "DB-backed integration tests need a MongoDB runtime. Choose one:",
    `1. Start MongoDB 7 locally or in Docker and set ${CONNECTION_URL_ENV}=mongodb://127.0.0.1:27017/halajob_local_test.`,
    `2. Set ${SYSTEM_BINARY_ENV} to an existing mongod binary so mongodb-memory-server does not download one.`,
    "3. Allow mongodb-memory-server to download/cache its MongoDB binary before running the aggregate gates.",
    "",
    `CI uses a MongoDB 7 service container and sets ${CONNECTION_URL_ENV}, so it does not depend on runtime binary downloads.`,
    `Original error: ${originalMessage}`,
  ].join("\n");
}

export async function createMemoryMongoHandle(options = {}, factory = MongoMemoryServer) {
  const systemBinary = String(process.env[SYSTEM_BINARY_ENV] || "").trim();
  const mode = systemBinary
    ? `mongodb-memory-server with ${SYSTEM_BINARY_ENV}`
    : `mongodb-memory-server download/cache fallback; set ${CONNECTION_URL_ENV} to use external MongoDB`;
  console.log(`[integration-mongo] using ${mode}`);

  if (systemBinary && !existsSync(systemBinary)) {
    const error = new Error(`${SYSTEM_BINARY_ENV} does not exist: ${systemBinary}`);
    throw new Error(buildIntegrationMongoHelp(error), { cause: error });
  }

  try {
    return await factory.create(options);
  } catch (error) {
    throw new Error(buildIntegrationMongoHelp(error), { cause: error });
  }
}

function externalMongoHandle(connectionUrl) {
  return {
    getUri() {
      return connectionUrl;
    },
    async stop() {
      // The caller owns the external MongoDB process. Scripts still drop their
      // scoped database through mongoose cleanup, but must not stop the server.
    },
  };
}

export const IntegrationMongoServer = {
  async create(options = {}) {
    const externalUrl = String(process.env[CONNECTION_URL_ENV] || "").trim();
    if (externalUrl) {
      const dbName = dbNameFromOptions(options);
      const connectionUrl = scopedConnectionUrl(externalUrl, dbName);
      console.log(`[integration-mongo] using external MongoDB database ${dbName}`);
      return externalMongoHandle(connectionUrl);
    }

    return createMemoryMongoHandle(options);
  },
};
