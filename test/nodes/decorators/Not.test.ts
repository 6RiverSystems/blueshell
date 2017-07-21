'use strict';

import {assert} from 'chai';

import {
	Operation,
	ResultCodes,
	Not
} from '../../../lib';

class EchoAction extends Operation<any> {
	onEvent(state: any): Promise<ResultCodes> {
		return Promise.resolve(state.forcedResult);
	}
}

describe('Not', function() {

	it('should negate the result code', function() {

		let echo = new EchoAction();
		let unEcho = new Not('unEcho', echo);

		let tests: any = [
			{action: echo, forcedResult: ResultCodes.SUCCESS, result: ResultCodes.SUCCESS},
			{action: echo, forcedResult: ResultCodes.FAILURE, result: ResultCodes.FAILURE},
			{action: echo, forcedResult: ResultCodes.RUNNING, result: ResultCodes.RUNNING},
			{action: unEcho, forcedResult: ResultCodes.SUCCESS, result: ResultCodes.FAILURE},
			{action: unEcho, forcedResult: ResultCodes.FAILURE, result: ResultCodes.SUCCESS},
			{action: unEcho, forcedResult: ResultCodes.RUNNING, result: ResultCodes.RUNNING}
		];

		let makeVerify = function(test: any) {
			return function(res: any) {
				assert.equal(res, test.result, `${test.action.name} -> ${test.result}`);
			};
		};

		let ps: any = [];

		for (let test of tests) {
			let p = test.action.handleEvent(test);

			ps.push(p.then(makeVerify(test)));
		}

		return Promise.all(ps);

	});
});
