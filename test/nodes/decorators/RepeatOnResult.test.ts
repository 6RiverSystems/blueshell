/**
 * Created by josh on 1/21/16.
 */
'use strict';

import {assert} from 'chai';

import {
	Operation,
	ResultCodes,
	RepeatOnResult
} from '../../../lib';

class CountUntil extends Operation<any, any> {

	limit: number;

	constructor(limit: number) {
		super();

		this.limit = limit;
	}

	onEvent(state: number, event: Event): Promise<ResultCodes> {

		(<any>state).number += 1;

		return Promise.resolve(state <= this.limit ? ResultCodes.RUNNING : ResultCodes.SUCCESS);
	}
}

describe('RepeatOnResult', function() {
	it('repeat when child returns running', function() {

		let countUntil = new CountUntil(3);
		let unEcho = new RepeatOnResult(ResultCodes.RUNNING, countUntil);

		let tests = [
			{action: unEcho, event: {}, counter: 1},
			{action: unEcho, event: {}, counter: 3}
		];

		let makeVerify = function(test: any) {
			return function(res: any) {
				assert.equal(res.state.counter, test.counter, `Counter: ${test.action.name} -> ${test.counter}`);
				assert.equal(res, ResultCodes.SUCCESS, `Result: ${test.action.name} -> ${test.counter}`);
			};
		};

		for (let test of tests) {
			// isolated per test
			let counter: any = {
				number: 0
			};

			let p = test.action.handleEvent(counter, test.event);

			p.then(makeVerify(test));
		}

	});
});
