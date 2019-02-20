/**
 * Created by josh on 1/10/16.
 */
import {assert} from 'chai';

import {resultCodes as rc} from '../../lib/utils/resultCodes';

import * as Behavior from '../../lib';
import {BlueshellState} from '../../lib/nodes/BlueshellState';

class TestState implements BlueshellState {
	public success: boolean = false;
	public errorReason?: Error;
	public __blueshell: any;
}

describe('IfElse', function() {
	const successAction = new (class extends Behavior.Action<TestState, string> {
		onEvent(state: TestState) {
			state.success = true;

			return rc.SUCCESS;
		}
	})();

	const failureAction = new (class extends Behavior.Action<TestState, string> {
		onEvent(state: TestState) {
			state.success = false;

			return rc.FAILURE;
		}
	})();

	it('should return success when conditional is true with no alternative', function() {
		const ifElse = new Behavior.IfElse('testIfElse',
			() => true,
			successAction
		);

		const state = new TestState();
		const res = ifElse.handleEvent(state, 'testEvent');

		assert.notOk(state.errorReason);
		assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
		assert.isTrue(state.success, 'Expected Action was called');
	});

	it('should return success when conditional is true with an alternative', function() {
		const ifElse = new Behavior.IfElse('testIfElse',
			() => true,
			successAction,
			failureAction
		);

		const state = new TestState();
		const res = ifElse.handleEvent(state, 'testEvent');

		assert.notOk(state.errorReason);
		assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
		assert.isTrue(state.success, 'Expected Action was called');
	});

	it('should return success when conditional is false', function() {
		const ifElse = new Behavior.IfElse('testIfElse',
			() => false,
			failureAction,
			successAction
		);

		const state = new TestState();
		const res = ifElse.handleEvent(state, 'testEvent');

		assert.notOk(state.errorReason);
		assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
		assert.isTrue(state.success, 'Expected Action was called');
	});


	it('should return failure when conditional is false and there is no alternative', function() {
		const ifElse = new Behavior.IfElse('testIfElse',
			() => false,
			successAction
		);

		const state = new TestState();
		const res = ifElse.handleEvent(state, 'testEvent');

		assert.notOk(state.errorReason);
		assert.equal(res, rc.FAILURE, 'Behavior Tree success');
		assert.isNotTrue(state.success, 'Expected Action was called');
	});
});
