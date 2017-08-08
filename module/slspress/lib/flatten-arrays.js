'use strict';

module.exports = (arrays) => {
  return [].concat.apply([], arrays);
};
