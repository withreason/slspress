'use strict';

const expect = require('chai').expect;

const ContainerManager = require('../../../lib/container/container-manager');
const Component = require('../../../lib/container/component');
const Container = require('../../../lib/container/container');

class FakeComponent extends Component {
  constructor(var_args) {
    super();
    this.contructorArgs = arguments;
    this.startCallCount = 0;
    this.stopCallCount = 0;
  }

  start() {
    this.startArgs = arguments;
    this.startCallCount++;
  }

  stop() {
    this.stopArgs = arguments;
    this.stopCallCount++;
  }
}

class FakeComponent1 extends FakeComponent {}
class FakeComponent2 extends FakeComponent {}
class NotAComponent {}



describe('ContainerManager', () =>  {

  describe('start container', () => {
    it('should construct each component and pass in the container', done =>  {
      const manager = new ContainerManager([
        { name: 'com1', componentClass: FakeComponent1, additionalArguments: []},
        { name: 'com2', componentClass: FakeComponent2, additionalArguments: []}
      ]);

      manager.startContainer(null, null, () => {
        expect(manager.container.fetch('com1').contructorArgs[0] instanceof Container).to.be.true;
        expect(manager.container.fetch('com2').contructorArgs[0] instanceof Container).to.be.true;
        done();
      });
    });

    it('should NOT construct a class that does not extend from component', done =>  {
      const manager = new ContainerManager([
        { name: 'com1', componentClass: NotAComponent, additionalArguments: []}
      ]);

      manager.startContainer(null, null, () => {
        expect(typeof manager.container.fetch('com1')).to.equal('function');
        expect(manager.container.fetch('com1')).to.equal(NotAComponent);
        done();
      });
    });

    it('should allow pre-constructed components in the container', done =>  {
      const preConstructed = new FakeComponent1();
      const manager = new ContainerManager([
        { name: 'com1', componentClass: preConstructed, additionalArguments: []}
      ]);

      manager.startContainer(null, null, () => {
        expect(manager.container.fetch('com1')).to.equal(preConstructed);
        done();
      });
    });

    it('should allow plain objects in the container', done =>  {
      const plainObject = { a: 'object' };
      const manager = new ContainerManager([
        { name: 'com1', componentClass: plainObject, additionalArguments: []}
      ]);

      manager.startContainer(null, null, () => {
        expect(manager.container.fetch('com1')).to.equal(plainObject);
        done();
      });
    });

    it('should start each component', done =>  {
      const manager = new ContainerManager([
        { name: 'com1', componentClass: FakeComponent1, additionalArguments: []},
        { name: 'com2', componentClass: FakeComponent2, additionalArguments: []}
      ]);

      manager.startContainer(null, null, () => {
        expect(manager.container.fetch('com1').startCallCount).to.equal(1);
        expect(manager.container.fetch('com2').startCallCount).to.equal(1);
        done();
      });
    });

    it('should pass through additional arguments', done =>  {
      const manager = new ContainerManager([
        { name: 'com1', componentClass: FakeComponent1, additionalArguments: ['a', 'b']},
        { name: 'com2', componentClass: FakeComponent2, additionalArguments: ['c']}
      ]);

      manager.startContainer(null, null, () => {
        expect(manager.container.fetch('com1').contructorArgs[0] instanceof Container).to.be.true;
        expect(manager.container.fetch('com1').contructorArgs[1]).to.equal('a');
        expect(manager.container.fetch('com1').contructorArgs[2]).to.equal('b');
        expect(manager.container.fetch('com2').contructorArgs[0] instanceof Container).to.be.true;
        expect(manager.container.fetch('com2').contructorArgs[1]).to.equal('c');
        done();
      });
    });
  });

  describe('stop container', () => {
    it('should do nothing if not started', done => {
      const com1 = new FakeComponent1();
      const com2 = new FakeComponent2();
      const manager = new ContainerManager([
        {name: 'com1', componentClass: com1, additionalArguments: []},
        {name: 'com2', componentClass: com2, additionalArguments: []}
      ]);

      manager.stopContainer(null, null, () => {
        expect(manager.container).to.be.null;
        expect(com1.stopCallCount).to.equal(0);
        expect(com2.stopCallCount).to.equal(0);
        done();
      });
    });

    it('should stop all components', done => {
      const manager = new ContainerManager([
        {name: 'com1', componentClass: FakeComponent1, additionalArguments: []},
        {name: 'com2', componentClass: FakeComponent2, additionalArguments: []}
      ]);
      manager.startContainer(null, null, () => {
        const com1 = manager.container.fetch('com1');
        const com2 = manager.container.fetch('com1');
        manager.stopContainer(null, null, () => {
          expect(com1.stopCallCount).to.equal(1);
          expect(com2.stopCallCount).to.equal(1);
          done();
        });
      });
    });
  });

});