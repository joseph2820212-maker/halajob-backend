import { MongoMemoryServer } from "mongodb-memory-server";

const token = () => new Date().toISOString().replace(/[-:.TZ]/g, "");

function scopedConnectionUrl(rawUrl, dbName) {
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
    const externalUrl = String(process.env.CONNECTION_URL || "").trim();
    if (externalUrl) {
      const dbName = dbNameFromOptions(options);
      const connectionUrl = scopedConnectionUrl(externalUrl, dbName);
      console.log(`[integration-mongo] using external MongoDB database ${dbName}`);
      return externalMongoHandle(connectionUrl);
    }

    return MongoMemoryServer.create(options);
  },
};
