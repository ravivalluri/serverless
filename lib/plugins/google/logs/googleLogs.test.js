'use strict';

const sinon = require('sinon');
const BbPromise = require('bluebird');

const GoogleProvider = require('../provider/googleProvider');
const GoogleLogs = require('./googleLogs');
const Serverless = require('../test/serverless');

describe('GoogleLogs', () => {
  let serverless;
  let options;
  let googleLogs;

  beforeEach(() => {
    serverless = new Serverless();
    options = {
      stage: 'my-stage',
      region: 'my-region',
    };
    serverless.setProvider('google', new GoogleProvider(serverless));
    googleLogs = new GoogleLogs(serverless, options);
  });

  describe('#constructor()', () => {
    it('should set the serverless instance', () => {
      expect(googleLogs.serverless).toEqual(serverless);
    });

    it('should set options if provided', () => {
      expect(googleLogs.options).toEqual(options);
    });

    it('should make the provider accessible', () => {
      expect(googleLogs.provider).toBeInstanceOf(GoogleProvider);
    });

    describe('hooks', () => {
      let validateStub;
      let setDefaultsStub;
      let retrieveLogsStub;

      beforeEach(() => {
        validateStub = sinon.stub(googleLogs, 'validate')
          .returns(BbPromise.resolve());
        setDefaultsStub = sinon.stub(googleLogs, 'setDefaults')
          .returns(BbPromise.resolve());
        retrieveLogsStub = sinon.stub(googleLogs, 'retrieveLogs')
          .returns(BbPromise.resolve());
      });

      afterEach(() => {
        googleLogs.validate.restore();
        googleLogs.setDefaults.restore();
        googleLogs.retrieveLogs.restore();
      });

      it('should run "before:logs:logs" promise chain', () => googleLogs
        .hooks['before:logs:logs']().then(() => {
          expect(validateStub.calledOnce).toEqual(true);
          expect(setDefaultsStub.calledAfter(validateStub)).toEqual(true);
        })
      );

      it('should run "logs:logs" promise chain', () => googleLogs
        .hooks['logs:logs']().then(() => {
          expect(retrieveLogsStub.calledOnce).toEqual(true);
        })
      );
    });
  });
});
