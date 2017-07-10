/**
 * Created by josh on 1/21/16.
 */
'use strict';

import {Decorator} from '../Decorator';
import {Base} from '../Base';
import {BehaviorCode} from '../../utils/ResultCodes';

// Swaps one result from the child for another
// You can use this to mask FAILURE, etc
//
// For example, you can use this to have a Sequence continue operation
// when a child returns FAILURE.
export class ResultSwap extends Decorator {

	_inResult: BehaviorCode;
	_outResult: BehaviorCode;

	constructor(inResult: BehaviorCode, outResult: BehaviorCode, child: Base) {
		super('ResultSwap_' + inResult + '-' + outResult, child);
		this._inResult = inResult;
		this._outResult = outResult;
	}

	onRun(state: any): Promise<BehaviorCode> {
		return this.child.run(state)
			.then((res: BehaviorCode) => {
				if (res === this._inResult) {
					res = this._outResult;
				}

				return res;
		});
	}
}
