const { getServer } = require("../dist/serverless");

/** Vercel serverless entry — routes all HTTP to NestJS Express. */
module.exports = async (req, res) => {
  const server = await getServer();
  return server(req, res);
};
