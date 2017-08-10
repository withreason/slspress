'use strict';

const expect = require('chai').expect;

const subject = require('../../lib/validate-headers-object');

describe('Validate Headers', () => {

  it('should accept a string string map', () => {
    expect(() => subject({ some: 'header'})).not.to.throw();
  });

  it('should NOT accept a object with numbers', () => {
    expect(() => subject({ some: 5})).to.throw();
  });

  it('should NOT accept a function', () => {
    expect(() => subject(() => {})).to.throw();
  });

});