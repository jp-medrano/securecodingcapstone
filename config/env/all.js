const crypto = require("crypto");

// default app configuration
const port = process.env.PORT || 4000;
const db = process.env.MONGODB_URI || "mongodb://localhost:27017/nodegoat";

module.exports = {
    port,
    db,
    // Secrets come from the environment. The random fallback means sessions reset on every restart,
    // so set COOKIE_SECRET and CRYPTO_KEY in Render.
    cookieSecret: process.env.COOKIE_SECRET || crypto.randomBytes(32).toString("hex"),
    cryptoKey: process.env.CRYPTO_KEY || crypto.randomBytes(32).toString("hex"),
    cryptoAlgo: "aes256",
    hostName: "localhost",
    environmentalScripts: []
};