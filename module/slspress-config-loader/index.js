
'use strict';

const yaml = require('js-yaml');
const fs = require('fs');
const objectMerge = require('object-merge');

const ENV_OVERRIDE_PREFIX = "SLSPRESS_";

/**
 * Load config from a folder based on the current environment. It expects config files named in the following way:
 * config.${stage}.yml
 *
 * It also supports loading config from 'secret files' and from environment variables with secret files overriding
 * keys in the original config file and environment variables taking top priority.
 *
 * Secret files are looked for along side the original config file: config.${stage}.secret.yml
 * Env variables are expected to conform to the following patten "SLSPRESS_DEVELOPMENT_KEY"
 * where DEVELOPMENT can be swapped out for a different stage name anf key for a different property key.
 *
 * @param directory the directory where your config files are located.
 * @param stage the environment stage to load config for.
 * @returns {*} the loaded config.
 */
module.exports = (directory, stage) => {
  let config = yaml.safeLoad(fs.readFileSync(`${directory}/config.${stage}.yml`, 'utf8'));

  const secretFileName = `${directory}/config.${stage}.secret.yml`;
  if (fs.existsSync(secretFileName)) {
    const secretConfig = yaml.safeLoad(fs.readFileSync(secretFileName, 'utf8'));
    config = objectMerge(config, secretConfig)
  }
  const prefix = `${ENV_OVERRIDE_PREFIX}${stage.toUpperCase()}`;

  Object.keys(process.env)
    .filter(key => key.startsWith(prefix))
    .map(key => {
      const strippedKey = key.substring(prefix.length);
      const env = {};
      env[strippedKey] = process.env[key];
      return { env: env };
    }).forEach(override => {
    config = objectMerge(config, override);
  });

  return config;
};