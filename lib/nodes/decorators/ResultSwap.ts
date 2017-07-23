'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Base} from '../Base';
import {Decorator} from './Decorator';

// Swaps one result from the child for another
// You can use this to mask FAILURE, etc
//
// For example, you can use this to have a Sequence continue operation
// when a child returns FAILURE.
export class ResultSwap<State> extends Decorator<State> {

	private inResult: ResultCodes;
	private outResult: ResultCodes;

	constructor(inResult: ResultCodes, outResult: ResultCodes, child: Base<State>) {
		super('ResultSwap_' + inResult + '-' + outResult, child);
		this.inResult = inResult;
		this.outResult = outResult;
	}

	onRun(state: State): Promise<ResultCodes> {

		let p = this.child.onRun(state);

		return p.then((res: ResultCodes) => {
			if (res === this.inResult) {
				res = this.outResult;
			}

			return res;
		});
	}
}
