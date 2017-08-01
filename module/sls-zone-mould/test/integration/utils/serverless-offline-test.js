'use strict';

const ServerlessOffline = require('serverless-offline');

class OfflineTest extends ServerlessOffline {

  constructor(serverless, options) {
    super(serverless, options);
  }

  start() {
    this._checkVersion();

    // Some users would like to know their environment outside of the handler
    process.env.IS_OFFLINE = true;

    return Promise.resolve(this._buildServer())
      .then(() => this._listen());
  }

  stop() {
    return this.server.stop({ timeout: 5000 })
      .then(() => this.serverlessLog(`Offline stopped listening on http${this.options.httpsProtocol ? 's' : ''}://${this.options.host}:${this.options.port}`));
  }
}

module.exports = OfflineTest;