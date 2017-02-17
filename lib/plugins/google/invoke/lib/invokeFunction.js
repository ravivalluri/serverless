'use strict';

/* eslint no-use-before-define: 0 */

const BbPromise = require('bluebird');

module.exports = {
  invokeFunction() {
    return BbPromise.bind(this)
      .then(this.invoke)
      .then(this.getLogs)
      .then(this.printLogs);
  },

  invoke() {
    const project = this.serverless.service.provider.project;
    const region = this.options.region;
    let func = this.options.function;
    const data = this.options.data || '';

    func = getGoogleCloudFunctionName(this.serverless.service.functions, func);

    const params = {
      name: `projects/${project}/locations/${region}/functions/${func}`,
      resource: {
        data,
      },
    };

    return this.provider.request(
      'cloudfunctions',
      'projects',
      'locations',
      'functions',
      'call',
      params
    );
  },

  getLogs() {
    const project = this.serverless.service.provider.project;
    const region = this.options.region;
    let func = this.options.function;

    func = getGoogleCloudFunctionName(this.serverless.service.functions, func);

    return this.provider.request('logging', 'entries', 'list', {
      filter: `Function execution ${func} ${region}`,
      orderBy: 'timestamp desc',
      resourceNames: [
        `projects/${project}`,
      ],
      // only show the last to results, because they are
      // the "started" and "result" logs for the function
      pageSize: 2,
    });
  },

  printLogs(logs) {
    if (!logs.entries || !logs.entries.length) {
      logs = { //eslint-disable-line
        entries: [
          {}, // represents "function execution started"
          { // represents function "result"
            textPayload: 'There is no log data available right now...',
          },
        ],
      };
    }

    this.serverless.cli.log(logs.entries[1].textPayload);

    return BbPromise.resolve();
  },
};

// retrieve the functions name (Google uses our handler property as the function name)
const getGoogleCloudFunctionName = (serviceFunctions, func) => {
  if (!serviceFunctions[func]) {
    const errorMessage = [
      `Function "${func}" not found. `,
      'Please check your "serverless.yml" file for the correct function name.',
    ].join('');
    throw new Error(errorMessage);
  }

  return serviceFunctions[func].handler;
};
