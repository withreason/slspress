'use strict';

const yaml = require('js-yaml');
const fs = require('fs');
const objectMerge = require('object-merge');

const ENV_OVERRIDE_PREFIX = "SLSZ_OVERRIDE_";

module.exports = (stage, directory) => {
  let config = yaml.safeLoad(fs.readFileSync(`${directory}/config.${stage}.yml`, 'utf8'));

  const secretFileName = `${directory}/config.${stage}.secret.yml`;
  if (fs.existsSync(secretFileName)) {
    const secretConfig = yaml.safeLoad(fs.readFileSync(secretFileName, 'utf8'));
    config = objectMerge(config, secretConfig)
  }

  Object.keys(process.env)
    .filter(key => key.startsWith(ENV_OVERRIDE_PREFIX))
    .map(key => {
      const strippedKey = key.substring(ENV_OVERRIDE_PREFIX.length);
      const env = {};
      env[strippedKey] = process.env[key];
      return { env };
    }).forEach(override => {
      config = objectMerge(config, override);
    });

  return config;
};