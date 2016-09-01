/**
 * Created by josh on 1/21/16.
 */
'use strict';

import Decorator = require('../Decorator');
import ResultCodes = require('../../utils/ResultCodes');
import Base = require('../Base');

// Swaps one result from the child for another
// You can use this to mask FAILURE, etc
//
// For example, you can use this to have a Sequence continue operation
// when a child returns FAILURE.
class ResultSwap extends Decorator {

	_inResult: ResultCodes;
	_outResult: ResultCodes;

	constructor(inResult: ResultCodes, outResult: ResultCodes, child: Base) {
		super('ResultSwap_' + inResult + '-' + outResult, child);
		this._inResult = inResult;
		this._outResult = outResult;
	}

	onEvent(state: any, event: any): Promise<ResultCodes> {

		let p = this.child.handleEvent(state, event);

		return p.then(res => {
			if (res === this._inResult) {
				res = this._outResult;
			}

			return res;
		});
	}
}

export = ResultSwap;
