/**
 * Created by josh on 1/21/16.
 */
'use strict';

let Not = require('./Not');
let RepeatWhen = require('./RepeatWhen');
let RepeatOnResult = require('./RepeatOnResult');
let ResultSwap = require('./ResultSwap');

let decorators = {
	Not,
	RepeatWhen,
	RepeatOnResult,
	ResultSwap
};

module.exports = decorators;
