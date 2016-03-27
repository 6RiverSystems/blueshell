/**
 * Created by josh on 1/12/16.
 */
'use strict';

var RepeatWhere = require('./RepeatWhen');

class RepeatOnResult extends RepeatWhere {

	constructor(result, child) {
		super('ResultEquals-' + result, child, (res) => res.result === result);
	}

}

module.exports = RepeatOnResult;
