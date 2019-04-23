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

describe('When', function() {
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

	it('should return success when conditional is true', function() {
		const When = new Behavior.When('testWhen',
			() => true,
			successAction
		);

		const state = new TestState();
		const res = When.handleEvent(state, 'testEvent');

		assert.notOk(state.errorReason);
		assert.strictEqual(res, rc.SUCCESS, 'Behavior Tree should return success');
		assert.isTrue(state.success, 'Expected Action was not called');
	});

	it('should return success when conditional is false', function() {
		const When = new Behavior.When('testWhen',
			() => false,
			failureAction,
		);

		const state = new TestState();
		const res = When.handleEvent(state, 'testEvent');

		assert.notOk(state.errorReason);
		assert.strictEqual(res, rc.SUCCESS, 'Behavior Tree should return success');
		assert.isNotTrue(state.success, 'Expected Action was not called');
	});

	it('should return failure when conditional is false', function() {
		const When = new Behavior.When('testWhen',
			() => false,
			failureAction,
			rc.FAILURE,
		);

		const state = new TestState();
		const res = When.handleEvent(state, 'testEvent');

		assert.notOk(state.errorReason);
		assert.strictEqual(res, rc.FAILURE, 'Behavior Tree should return success');
		assert.isNotTrue(state.success, 'Expected Action was not called');
	});


	it('should handle latched children', function() {
		let failed = false;
		const failOnceAction = new (class extends Behavior.Action<TestState, string> {
			onEvent(state: TestState) {
				if (!failed) {
					state.success = false;
					failed = true;
					return rc.FAILURE;
				}
				state.success = true;
				return rc.SUCCESS;
			}
		})();

		let running = false;
		const runningOnceAction = new (class extends Behavior.Action<TestState, string> {
			onEvent(state: TestState) {
				if (!running) {
					state.success = false;
					running = true;
					return rc.RUNNING;
				}
				state.success = true;
				return rc.SUCCESS;
			}
		})();
		const child = new Behavior.LatchedSequence('testLatchedSequence', [
			failOnceAction,
			runningOnceAction,
			successAction,
		]);
		const When = new Behavior.When('testWhen',
			(state: TestState, event: string) => event !== 'ignore',
			child
		);

		const state = new TestState();
		let res = When.handleEvent(state, 'testEvent');

		assert.notOk(state.errorReason);
		assert.strictEqual(res, rc.FAILURE, 'Behavior Tree should return FAILURE');
		assert.isNotTrue(state.success, 'state should not have success indication');

		res = When.handleEvent(state, 'ignore');

		assert.notOk(state.errorReason);
		assert.strictEqual(res, rc.SUCCESS, 'Behavior Tree should return SUCCESS');
		assert.isNotTrue(state.success, 'state should not have success indication');

		res = When.handleEvent(state, 'testEvent');

		assert.notOk(state.errorReason);
		assert.strictEqual(res, rc.RUNNING, 'Behavior Tree should return SUCCESS');
		assert.isNotTrue(state.success, 'state should not have success indication');

		res = When.handleEvent(state, 'ignore');

		assert.notOk(state.errorReason);
		assert.strictEqual(res, rc.SUCCESS, 'Behavior Tree should return SUCCESS');
		assert.isNotTrue(state.success, 'state should not have success indication');

		res = When.handleEvent(state, 'testEvent');

		assert.notOk(state.errorReason);
		assert.strictEqual(res, rc.SUCCESS, 'Behavior Tree should return SUCCESS');
		assert.isTrue(state.success, 'state should not have success indication');

		res = When.handleEvent(state, 'testEvent');

		assert.notOk(state.errorReason);
		assert.strictEqual(res, rc.SUCCESS, 'Behavior Tree should return SUCCESS');
	});
});
