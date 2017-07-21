/**
 * Created by josh on 1/21/16.
 */
'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Action} from '../actions/Action';
import {Decorator} from '../Decorator';

// Swaps one result from the child for another
// You can use this to mask FAILURE, etc
//
// For example, you can use this to have a Sequence continue operation
// when a child returns FAILURE.
export class ResultSwap<State>extends Decorator<State> {

	private inResult: ResultCodes;
	private outResult: ResultCodes;

	constructor(inResult: ResultCodes, outResult: ResultCodes, child: Action<State>) {
		super('ResultSwap_' + inResult + '-' + outResult, child);
		this.inResult = inResult;
		this.outResult = outResult;
	}

	onEvent(state: State): Promise<ResultCodes> {

		let p = this.child.handleEvent(state);

		return p.then(res => {
			if (res === this.inResult) {
				res = this.outResult;
			}

			return res;
		});
	}
}
