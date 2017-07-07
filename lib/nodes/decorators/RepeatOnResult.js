/**
 * Created by josh on 1/12/16.
 */
'use strict';

const RepeatWhen = require('./RepeatWhen');

class RepeatOnResult extends RepeatWhen {

	constructor(repeatRes, child) {
		super('ResultEquals-' + repeatRes, child,
			(state, event, res) => res === repeatRes);
	}

}

module.exports = RepeatOnResult;
