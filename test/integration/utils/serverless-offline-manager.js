'use strict';
const path = require('path');
const SPath = path.dirname(require.resolve('serverless'));
const Serverless = require(path.resolve(SPath, 'Serverless'));
const OfflineTest = require('./serverless-offline-test');
const randomPort = require('random-port');
const objectMerge = require('object-merge');

const getPort = () => {
  return new Promise(function(resolve,reject){
    try {
      randomPort(resolve);
    } catch (e) {
      reject(e);
    }
  });
};

const defaultOptions = {
  serverless: {
    servicePath: process.cwd()
  },
  port: 0
};

class ServerlessOfflineManager {
  
  constructor(options) {
    this._options = options ? objectMerge(defaultOptions, options) : defaultOptions;
    this._offline = null;
  }

  start(envVars) {
    if (envVars) {
      Object.keys(envVars).forEach(key => {
        process.env[key] = envVars[key];
      });
    }

    return this._options.port
      ? this._startOnPort(this._options.port)
      : getPort().then(this._startOnPort.bind(this));
  }

  _startOnPort(port) {
    const serverless = new Serverless(this._options.serverless);

    return serverless.init().then(() => {
      this._offline = new OfflineTest(serverless, {port});
      return this._offline.start();
    }).then(() => `http://localhost:${port}`);
  }
  
  stop() {
    return this._offline.stop();
  }
}

module.exports = ServerlessOfflineManager;