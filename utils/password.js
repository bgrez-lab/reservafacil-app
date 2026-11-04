const bcrypt = require('bcrypt');

const configuredRounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const SALT_ROUNDS = Number.isNaN(configuredRounds)
  ? 12
  : Math.min(14, Math.max(10, configuredRounds));

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  comparePassword
};
