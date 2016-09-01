/**
 * Created by josh on 1/12/16.
 */
'use strict';

import RepeatWhen = require('./RepeatWhen');
import Base = require('../Base');
import ResultCodes = require('../../utils/ResultCodes');

class RepeatOnResult extends RepeatWhen {

	constructor(repeatRes: ResultCodes, child: Base) {
		super('ResultEquals-' + repeatRes, child, (res) => res === repeatRes);
	}

}

export = RepeatOnResult;
