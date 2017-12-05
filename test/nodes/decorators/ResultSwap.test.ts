'use strict';

import {assert} from 'chai';

import {
	Operation,
	ResultCodes,
	ResultSwap
} from '../../../lib';

class EchoAction extends Operation<any> {
	onRun(state: any): Promise<ResultCodes> {
		return Promise.resolve(state.forcedResult);
	}
}

describe('ResultSwap', function() {

	it('should convert failure to success', function() {

		let echo = new EchoAction();
		let swapResult = new ResultSwap(ResultCodes.FAILURE, ResultCodes.SUCCESS, echo);

		let tests: any = [
			{action: swapResult, forcedResult: ResultCodes.FAILURE, result: ResultCodes.SUCCESS},
			{action: swapResult, forcedResult: ResultCodes.SUCCESS, result: ResultCodes.SUCCESS},
			{action: swapResult, forcedResult: ResultCodes.RUNNING, result: ResultCodes.RUNNING},
		];

		let makeVerify = function(test: any) {
			return function(res: any) {
				assert.equal(res, test.result, `${test.action.name} -> ${test.result}`);
			};
		};

		let ps: any = [];

		for (let test of tests) {
			let p = test.action.run(test);

			ps.push(p.then(makeVerify(test)));
		}

		return Promise.all(ps);

	});
});
