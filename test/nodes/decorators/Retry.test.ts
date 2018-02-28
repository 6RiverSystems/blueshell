'use strict';

import {assert} from 'chai';

import {
	Operation,
	ResultCodes,
	Retry,
} from '../../../lib';

class ResultReturner extends Operation<any> {

	result: ResultCodes;

	constructor(result: ResultCodes) {
		super();

		this.result = result;
	}

	onRun(state: number): Promise<ResultCodes> {

		(<any>state).number += 1;

		return Promise.resolve(this.result);
	}
}

describe('Retry ', function() {
	it('retry on failure', function() {
		let countUntil = new ResultReturner(ResultCodes.FAILURE);

		let retry = new Retry(countUntil, 2);

		let makeVerify = function(counter: any) {
			return function(res: any) {
				assert.equal(res, ResultCodes.FAILURE);
				assert.equal(counter.number, 3);
			};
		};

		let counter: any = {
			number: 0
		};

		let p = retry.run(counter);

		p.then(makeVerify(counter));
	});

	it('do not retry on success', function() {
		let countUntil = new ResultReturner(ResultCodes.SUCCESS);

		let retry = new Retry(countUntil, 2);

		let makeVerify = function(counter: any) {
			return function(res: any) {
				assert.equal(res, ResultCodes.SUCCESS);
				assert.equal(counter.number, 1);
			};
		};

		let counter: any = {
			number: 0
		};

		let p = retry.run(counter);

		p.then(makeVerify(counter));
	});

	it('do not retry on running', function() {
		let countUntil = new ResultReturner(ResultCodes.RUNNING);

		let retry = new Retry(countUntil, 2);

		let makeVerify = function(counter: any) {
			return function(res: any) {
				assert.equal(res, ResultCodes.RUNNING);
				assert.equal(counter.number, 1);
			};
		};

		let counter: any = {
			number: 0
		};

		let p = retry.run(counter);

		p.then(makeVerify(counter));
	});
});
