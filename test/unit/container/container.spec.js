'use strict';
const assert            = require('assert');
const Container = require('../../../lib/container/container');

const subject = new Container();

describe('Container', function() {
  describe('#_store', function() {
    it('returns an object where objects are stored', function() {
      assert.equal(typeof subject._store, 'object');
    });
  });

  describe('#register', function() {
    it('without a previously set value for that key - it registers an object', function() {
      const component = { foo: 'bar' };
      const key       = 'component:demo';

      subject.register(key, component);
      assert.deepEqual(subject._store[key]['component'], component);
    });

    it('with a previously set value for that key - it throws an error', function() {
      const key = 'component:demo';
      const fn  = (container, label) => {
        return () => {
          container.register(label, value)
        };
      };

      assert.throws(fn(subject, key), Error, `Duplicate declaration for ${key} found`);
    });
  });

  describe('#fetch', function() {

    it('with a registered record - returns the record and stores a fingerprint for further teardown', function() {
      const key = 'component:foo';
      const component = {};
      component.start = () => { return Promise.resolve(component) };
      subject.register(key, component);
      subject.fetch(key);

      assert.ok(subject._registry[key]);
    });

    it('with a registered record  and start without a promise - returns the record and stores a fingerprint for further teardown', function() {
      const key = 'component:foo2';
      const component = {};
      component.start = () => { };
      subject.register(key, component);
      subject.fetch(key);

      assert.ok(subject._registry[key]);
    });

    it('with a registered record - only calls start once', function() {
      const key = 'component:foo3';
      const component = {};
      let startCallCount = 0;
      component.start = () => { startCallCount++; return Promise.resolve(component) };
      subject.register(key, component);
      subject.fetch(key);
      subject.fetch(key);
      assert.equal(startCallCount, 1);
    });


    it('without a registered record and without a block - throws an error', function() {
      const key = 'key';
      const fn = (container) => {
        return () => {
          container.fetch(key);
        };
      };

      assert.throws(fn(subject), Error, `Could not find ${key}`);
    });
  });

  describe('#stop', function () {
    class CustomComponent {
      constructor() {
        this.connection = null;
      }

      start() {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            this.connection = true;
            resolve(this);
          }, 200);
        });
      }

      stop() {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            this.connection = null;
            resolve();
          }, 200);
        });
      }
    }

    class ComponentNotReturningPromises {
      constructor() {
        this.connection = null;
      }

      start() {
        this.connection = true;
      }

      stop() {
        this.connection = null;
      }
    }

    it('tearsdown its components and flushes the container', function () {
      const component = new CustomComponent();
      const container = new Container();
      const key = 'component';
      container.register(key, component);

      assert.ok(!component.connection);

      return container.fetch(key).then((resolvedComponent) => {
        assert.ok(resolvedComponent.connection);
        container.stop().then(() => {
          assert.ok(!component.connection);
        });
      });
    });

    it('tearsdown components whose stop does not return a promise', function () {
      const component = new ComponentNotReturningPromises();
      const container = new Container();
      const key = 'component';
      container.register(key, component);

      assert.ok(!component.connection);

      const resolvedComponent = container.fetch(key);
      assert.ok(resolvedComponent.connection);
      return container.stop().then(() => {
        assert.ok(!component.connection);
      });
    });

  });
});