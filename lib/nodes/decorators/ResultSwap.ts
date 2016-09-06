/**
 * Created by josh on 1/21/16.
 */
'use strict';

import {Decorator} from '../Decorator';
import {Base} from '../Base';
import {ResultCodes} from '../../utils/ResultCodes';

// Swaps one result from the child for another
// You can use this to mask FAILURE, etc
//
// For example, you can use this to have a Sequence continue operation
// when a child returns FAILURE.
export class ResultSwap extends Decorator {

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
