'use strict';

import {assert} from 'chai';

import {
	Operation,
	ResultCodes,
	Retry,
} from '../../../lib';

class CountUntil extends Operation<any> {

	limit: number;

	constructor(limit: number) {
		super();

		this.limit = limit;
	}

	onRun(state: number): Promise<ResultCodes> {

		(<any>state).number += 1;

		return Promise.resolve(state <= this.limit ? ResultCodes.RUNNING : ResultCodes.FAILURE);
	}
}

describe('Retry', function() {
	it('retry on failure', function() {

		let countUntil = new CountUntil(0);
		let retry = new Retry(countUntil, 2);

		let tests = [
			{action: retry, event: {}},
			{action: retry, event: {}}
		];

		let makeVerify = function(test: any, counter: any) {
			return function(res: any) {
				assert.equal(res, ResultCodes.FAILURE, `Result: ${test.action.name} -> ${counter.number}`);
				assert.equal(counter.number, 3);
			};
		};

		for (let test of tests) {
			// isolated per test
			let counter: any = {
				number: 0
			};

			let p = test.action.run(counter);

			p.then(makeVerify(test, counter));
		}

	});
});
