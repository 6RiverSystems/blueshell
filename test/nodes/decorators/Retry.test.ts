import {assert} from 'chai';

import {rc} from '../../../lib';
import * as Behavior from '../../../lib';

type RetryTestState = Behavior.BlueshellState & {number: number};

class ResultReturner extends Behavior.Action<RetryTestState, any> {
	private count = 0;

	constructor(
		private readonly result: Behavior.ResultCode,
		private readonly successAfterCount: number = 0
	) {
		super();
	}

	onEvent(state: RetryTestState): Behavior.ResultCode {
		state.number += 1;
		this.count++;
		if (this.successAfterCount > 0 && this.count > this.successAfterCount) {
			return rc.SUCCESS;
		} else {
			return this.result;
		}
	}
}

describe('Retry ', function() {
	it('retry on failure', function() {
		const counter: RetryTestState = {
			number: 0,
			__blueshell: {},
		};
		const countUntil = new ResultReturner(rc.FAILURE);
		const retry = new Behavior.decorators.Retry('RetryTest', countUntil, 2);

		const res = retry.handleEvent(counter, {});
		assert.equal(res, rc.FAILURE);
		assert.equal(counter.number, 3);
	});

	it('retry until success if numRepeat < 0', function() {
		const counter: RetryTestState = {
			number: 0,
			__blueshell: {},
		};
		const countUntil = new ResultReturner(rc.FAILURE, 3);
		const retry = new Behavior.decorators.Retry('RetryTest', countUntil, -1);

		const res = retry.handleEvent(counter, {});
		assert.equal(res, rc.SUCCESS);
		assert.equal(counter.number, 4);
	});

	it('do not retry on success', function() {
		const counter: any = {
			number: 0,
		};
		const countUntil = new ResultReturner(rc.SUCCESS);
		const retry = new Behavior.decorators.Retry('RetryTest', countUntil, 2);

		const res = retry.handleEvent(counter, {});
		assert.equal(res, rc.SUCCESS);
		assert.equal(counter.number, 1);
	});

	it('do not retry on running', function() {
		const counter: any = {
			number: 0,
		};
		const countUntil = new ResultReturner(rc.RUNNING);
		const retry = new Behavior.decorators.Retry('RetryTest', countUntil, 2);

		const res = retry.handleEvent(counter, {});
		assert.equal(res, rc.RUNNING);
		assert.equal(counter.number, 1);
	});
});
