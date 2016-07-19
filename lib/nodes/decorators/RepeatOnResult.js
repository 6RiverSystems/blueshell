/**
 * Created by josh on 1/12/16.
 */
'use strict';

let RepeatWhere = require('./RepeatWhen');

class RepeatOnResult extends RepeatWhere {

	constructor(repeatRes, child) {
		super('ResultEquals-' + repeatRes, child, (res) => res === repeatRes);
	}

}

module.exports = RepeatOnResult;
