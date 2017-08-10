'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
const expect = chai.expect;

const RouteConfig = require('../../../lib/config/route-config');
const configWrappers = require('../../../lib/config/route-config-wrappers');
const Component = require('../../../lib/container/component');

describe('RouteConfig', () => {

  let subject, extra, logger;

  beforeEach(() => {
    logger = { error: sinon.spy(), warn: sinon.spy(), log: sinon.spy() };
    subject = new RouteConfig(logger);
    extra = new RouteConfig(logger);
  });


  describe('find', () => {

    it('should filter out config of the wrong type', () => {
      subject._add('testHandler', 'testType1', false, 'val1');
      subject._add('testHandler', 'testType1', false, 'val2');
      subject._add('testHandler', 'testType2', true, 'val3');
      subject._add('testHandler', 'testType1', false, 'val4');

      const matchingConfig = subject.find('testHandler', 'testType1', extra);

      expect(matchingConfig).to.eql(['val1', 'val2', 'val4']);
    });

    it('should order global config first then handler config then extra global config then extra handler config', () => {
      subject._add('testHandler', 'testType', false, 'val1');
      subject._add(null, 'testType', false, 'val2');
      extra._add('testHandler', 'testType', false, 'val3');
      extra._add(null, 'testType', false, 'val4');

      const matchingConfig = subject.find('testHandler', 'testType', extra);

      expect(matchingConfig).to.eql(['val2', 'val1', 'val4', 'val3']);
    });

    it('config that overrides should replace existing config', () => {
      subject._add('testHandler', 'testType', false, 'val1');
      subject._add('testHandler', 'testType', false, 'val2');
      subject._add('testHandler', 'testType', true, 'val3');
      subject._add('testHandler', 'testType', false, 'val4');

      const matchingConfig = subject.find('testHandler', 'testType', extra);

      expect(matchingConfig).to.eql(['val3', 'val4']);
    });

    it('extra config that overrides should replace existing config', () => {
      subject._add('testHandler', 'testType', true, 'val1');
      subject._add(null, 'testType', true, 'val2');
      extra._add('testHandler', 'testType', true, 'val3');
      extra._add(null, 'testType', true, 'val4');

      const matchingConfig = subject.find('testHandler', 'testType', extra);

      expect(matchingConfig).to.eql(['val3']);
    });
  });

  describe('headers', () => {
    it('should append extra headers config', () => {
      subject.headers(null, { some: 'global header'});
      subject.headers('testHandler', { some: 'header'});

      const matchingConfig = subject.find('testHandler', 'headers');
      expect(matchingConfig).to.eql([{ some: 'global header'}, { some: 'header'}]);
    });

    it('should support config overriding', () => {
      subject.headers('testHandler', { some: 'header1'});
      subject.headers('testHandler', configWrappers.override({ some: 'header2'}));

      const matchingConfig = subject.find('testHandler', 'headers');
      expect(matchingConfig).to.eql([{ some: 'header2'}]);
    });

    it('should NOT accept a object with numbers', () => {
      expect(() => subject.headers('testHandler', { some: 5})).to.throw();
    });

    it('should NOT accept a function', () => {
      expect(() => subject.headers('testHandler', () => {})).to.throw();
    });

    it('should NOT accept no headers argument', () => {
      expect(() => subject.headers('testHandler')).to.throw();
    });

    it('should NOT accept more than one headers argument', () => {
      expect(() => subject.headers('testHandler', {}, {})).to.throw();
    });
  });

  describe('onError', () => {
    const errHandler1 = () => {};
    const errHandler2 = () => {};

    it('should overwrite existing config', () => {
      subject.onError(null, errHandler1);
      subject.onError('testHandler', errHandler2);

      const matchingConfig = subject.find('testHandler', 'onError');
      expect(matchingConfig).to.eql([errHandler2]);
    });

    it('should NOT support the override directive', () => {
      expect(() => subject.onError('testHandler', configWrappers.override(errHandler1))).to.throw();
    });

    it('should NOT accept a non function', () => {
      expect(() => subject.onError('testHandler', {})).to.throw();
    });

    it('should NOT accept no error handler argument', () => {
      expect(() => subject.onError('testHandler')).to.throw();
    });

    it('should NOT accept more than one error handler argument', () => {
      expect(() => subject.onError('testHandler', errHandler1, errHandler2)).to.throw();
    });
  });

  describe('middleware', () => {
    const reqMiddleware1 = configWrappers.request(() => {});
    const reqMiddleware2 = configWrappers.request(() => {});
    const resMiddleware = configWrappers.response(() => {});
    const finMiddleware = configWrappers.final(() => {});
    const unwrappedMiddleware = () => {};

    it('should append request middleware to existing config', () => {
      subject.middleware(null, reqMiddleware1);
      subject.middleware('testHandler',reqMiddleware2);

      const matchingConfig = subject.find('testHandler', 'middlewares');
      expect(matchingConfig).to.eql([[reqMiddleware1], [reqMiddleware2]]);
    });

    it('should append response middleware to existing config', () => {
      subject.middleware(null, reqMiddleware1);
      subject.middleware('testHandler',resMiddleware);

      const matchingConfig = subject.find('testHandler', 'middlewares');
      expect(matchingConfig).to.eql([[reqMiddleware1], [resMiddleware]]);
    });

    it('should append finally middleware to existing config', () => {
      subject.middleware(null, reqMiddleware1);
      subject.middleware('testHandler',finMiddleware);

      const matchingConfig = subject.find('testHandler', 'middlewares');
      expect(matchingConfig).to.eql([[reqMiddleware1], [finMiddleware]]);
    });

    it('should treat unwrapped middleware as request middleware', () => {
      subject.middleware(null, reqMiddleware1);
      subject.middleware('testHandler', unwrappedMiddleware);

      const matchingConfig = subject.find('testHandler', 'middlewares');
      expect(matchingConfig.length).to.equal(2);
      expect(matchingConfig[0]).to.eql([reqMiddleware1]);
      expect(matchingConfig[1][0].value).to.eql([unwrappedMiddleware]);
      expect(matchingConfig[1][0].middlewareType).to.eql('request');
    });

    it('should accept an array of middleware', () => {
      subject.middleware(null, [reqMiddleware1, reqMiddleware2]);

      const matchingConfig = subject.find('testHandler', 'middlewares');
      expect(matchingConfig).to.eql([[reqMiddleware1,reqMiddleware2]]);
    });

    it('should accept multiple middlewares', () => {
      subject.middleware(null, reqMiddleware1, reqMiddleware2);

      const matchingConfig = subject.find('testHandler', 'middlewares');
      expect(matchingConfig).to.eql([[reqMiddleware1, reqMiddleware2]]);
    });

    it('should accept multiple arrays of middleware', () => {
      subject.middleware(null, [reqMiddleware1, reqMiddleware2], [resMiddleware, finMiddleware]);

      const matchingConfig = subject.find('testHandler', 'middlewares');
      expect(matchingConfig).to.eql([[reqMiddleware1, reqMiddleware2, resMiddleware, finMiddleware]]);
    });

    it('should be able to override all middleware with new middleware', () => {
      subject.middleware(null, reqMiddleware1);
      subject.middleware('testHandler', resMiddleware, finMiddleware);
      subject.middleware('testHandler', configWrappers.override(reqMiddleware2));

      const matchingConfig = subject.find('testHandler', 'middlewares');
      expect(matchingConfig).to.eql([[reqMiddleware2]]);
    });

    it('should be able to remove all middleware', () => {
      subject.middleware(null, reqMiddleware1);
      subject.middleware('testHandler', resMiddleware, finMiddleware);
      subject.middleware('testHandler', configWrappers.override());

      const matchingConfig = subject.find('testHandler', 'middlewares');
      expect(matchingConfig).to.eql([[]]);
    });

    it('should NOT be able to provide multiple overrides', () => {
      expect(() => subject.middleware('testHandler',
        configWrappers.override(reqMiddleware1),
        configWrappers.override(reqMiddleware2))).to.throw();
    });

    it('should NOT be able to provide no middleware', () => {
      expect(() => subject.middleware('testHandler')).to.throw();
    });

    it('should NOT be able to provide non function middleware', () => {
      expect(() => subject.middleware(null, {})).to.throw();
    });

    it('should NOT be able to provide array of non function middleware', () => {
      expect(() => subject.middleware(null, [{}])).to.throw();
    });

    it('should NOT be able to provide overridden non function middleware', () => {
      expect(() => subject.middleware(null, configWrappers.override({}))).to.throw();
    });

    it('should NOT be able to provide array of overridden non function middleware', () => {
      expect(() => subject.middleware(null, configWrappers.override([{}]))).to.throw();
    });
  });

  describe('component', () => {
    const com1 = class extends Component {};
    const com2 = class extends Component {};

    it('should append to existing component config', () => {
      subject.component(null, 'com1', com1);
      subject.component('testHandler', 'com2', com2);

      const matchingConfig = subject.find('testHandler', 'component');
      expect(matchingConfig).to.eql([
        { name: 'com1', componentClass: com1, additionalArguments: []},
        { name: 'com2', componentClass: com2, additionalArguments: []}
      ]);
    });

    it('should accept additional args', () => {
      subject.component(null, 'com1', com1, 'arg1', 'arg2');
      subject.component('testHandler', 'com2', com2, ['arg1', 'arg2']);

      const matchingConfig = subject.find('testHandler', 'component');
      expect(matchingConfig).to.eql([
        { name: 'com1', componentClass: com1, additionalArguments: ['arg1', 'arg2']},
        { name: 'com2', componentClass: com2, additionalArguments: [['arg1', 'arg2']]}
      ]);
    });

    it('should accept object components', () => {
      const objComponent = { a: 'component' };
      subject.component(null, 'com1', objComponent);

      const matchingConfig = subject.find('testHandler', 'component');
      expect(matchingConfig).to.eql([
        { name: 'com1', componentClass: objComponent, additionalArguments: []},
      ]);
    });

    it('should accept literal components', () => {
      subject.component(null, 'com1', 'component');

      const matchingConfig = subject.find('testHandler', 'component');
      expect(matchingConfig).to.eql([
        { name: 'com1', componentClass: 'component', additionalArguments: []},
      ]);
    });

    it('should NOT support the override directive', () => {
      expect(() => subject.component('testHandler', configWrappers.override('com1', com1))).to.throw();
    });

    it('should NOT accept a non function', () => {
      expect(() => subject.component('testHandler', {})).to.throw();
    });

    it('should NOT accept no component argument', () => {
      expect(() => subject.component('testHandler', 'com1')).to.throw();
    });

    it('should NOT accept no name argument', () => {
      expect(() => subject.component('testHandler')).to.throw();
    });

    it('should NOT accept non string name argument', () => {
      expect(() => subject.component('testHandler', {}, com1)).to.throw();
    });
  });

  describe('componentDir', () => {
    const com1 = class extends Component {};

    it('should load only valid components', () => {
      subject.componentDir('testHandler', 'namespace', __dirname + '/fixtures/components', false);

      const matchingConfig = subject.find('testHandler', 'component');
      expect(matchingConfig).to.eql([{
        name: 'namespace/a-component',
        componentClass: require(__dirname + '/fixtures/components/a-component'),
        additionalArguments: []
      }, {
        name: 'namespace/b-component',
        componentClass: require(__dirname + '/fixtures/components/b-component'),
        additionalArguments: []
      }]);
    });

    it('should accept additional args', () => {
      subject.componentDir('testHandler', 'namespace', __dirname + '/fixtures/components', false, 'a', 'b');

      const matchingConfig = subject.find('testHandler', 'component');
      expect(matchingConfig).to.eql([{
        name: 'namespace/a-component',
        componentClass: require(__dirname + '/fixtures/components/a-component'),
        additionalArguments: ['a', 'b']
      }, {
        name: 'namespace/b-component',
        componentClass: require(__dirname + '/fixtures/components/b-component'),
        additionalArguments: ['a', 'b']
      }]);
    });

    it('should append components', () => {
      subject.component(null, 'com1', com1);
      subject.componentDir('testHandler', 'namespace', __dirname + '/fixtures/components', false);
      subject.componentDir('testHandler', 'namespace2', __dirname + '/fixtures/components/subfolder', false);

      const matchingConfig = subject.find('testHandler', 'component');
      expect(matchingConfig).to.eql([{
        name: 'com1',
        componentClass: com1,
        additionalArguments: []
      }, {
        name: 'namespace/a-component',
        componentClass: require(__dirname + '/fixtures/components/a-component'),
        additionalArguments: []
      }, {
        name: 'namespace/b-component',
        componentClass: require(__dirname + '/fixtures/components/b-component'),
        additionalArguments: []
      }, {
        name: 'namespace2/c-component',
        componentClass: require(__dirname + '/fixtures/components/subfolder/c-component'),
        additionalArguments: []
      }]);
    });

    it('should load from subdirectories', () => {
      subject.componentDir('testHandler', 'namespace', __dirname + '/fixtures/components', true);

      const matchingConfig = subject.find('testHandler', 'component');
      expect(matchingConfig).to.eql([{
        name: 'namespace/a-component',
        componentClass: require(__dirname + '/fixtures/components/a-component'),
        additionalArguments: []
      }, {
        name: 'namespace/b-component',
        componentClass: require(__dirname + '/fixtures/components/b-component'),
        additionalArguments: []
      }, {
        name: 'namespace/subfolder/c-component',
        componentClass: require(__dirname + '/fixtures/components/subfolder/c-component'),
        additionalArguments: []
      }]);
    });

    it('should NOT support the override directive', () => {
      expect(() => subject.componentDir('testHandler', configWrappers.override('namespace', __dirname + '/fixtures/components', true))).to.throw();
    });

    it('should NOT accept no namespace argument', () => {
      expect(() => subject.componentDir('testHandler')).to.throw();
    });

    it('should NOT accept non string namespace argument', () => {
      expect(() => subject.componentDir('testHandler', {}, __dirname + '/fixtures/components', true)).to.throw();
    });

    it('should NOT accept non string dir', () => {
      expect(() => subject.componentDir('testHandler', 'namespace', {}, true)).to.throw();
    });

    it('should NOT accept missing dir', () => {
      expect(() => subject.componentDir('testHandler', 'namespace', __dirname + '/missing', true)).to.throw();
    });

    it('should NOT accept non boolean recurse', () => {
      expect(() => subject.componentDir('testHandler', 'namespace',  __dirname + '/fixtures/components', {})).to.throw();
    });
  });
});