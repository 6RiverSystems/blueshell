/**
 * Created by josh on 1/10/16.
 */
import { assert } from 'chai';

import { rc } from '../../lib';
import * as Behavior from '../../lib';

class TestState implements Behavior.BlueshellState {
	public successCount = 0;
	public failureCount = 0;
	public errorReason?: Error;
	public __blueshell: any;
}

class TestRunningAction extends Behavior.Action<TestState, string> {
	public numCalls = 0;

	onEvent(state: TestState) {
		this.numCalls++;
		const nodeStorage = this.getNodeStorage(state);
		if (this.numCalls > 1) {
			assert.strictEqual(nodeStorage.lastResult, rc.RUNNING);
		}
		if (this.numCalls > 2) {
			return rc.SUCCESS;
		} else {
			return rc.RUNNING;
		}
	}
}

describe('IfElseWithNodeCondition', function () {
	const successAction = new (class extends Behavior.Action<TestState, string> {
		onEvent(state: TestState) {
			state.successCount++;
			return rc.SUCCESS;
		}
	})();

	const failureAction = new (class extends Behavior.Action<TestState, string> {
		onEvent(state: TestState) {
			state.failureCount++;
			return rc.FAILURE;
		}
	})();

	context('conditional returns success (true)', function () {
		it('should return success (consequent) when conditional is true with no alternative', function () {
			const ifElse = new Behavior.IfElseWithNodeCondition(
				'testIfElse',
				successAction,
				successAction,
			);

			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.strictEqual(state.successCount, 2, 'Expected Action was not called');
			assert.strictEqual(ifElse.getChildren().length, 2, 'ifElse does not have 2 children');
		});

		it('should return success (consequent) when conditional is true with an alternative rc', function () {
			const ifElse = new Behavior.IfElseWithNodeCondition(
				'testIfElse',
				successAction,
				successAction,
				rc.FAILURE,
			);

			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.strictEqual(state.successCount, 2, 'Expected Action was not called');
			assert.strictEqual(ifElse.getChildren().length, 3, 'ifElse does not have 3 children');
		});

		it('should return success (consequent) when conditional is true with an alternative node', function () {
			const ifElse = new Behavior.IfElseWithNodeCondition(
				'testIfElse',
				successAction,
				successAction,
				failureAction,
			);

			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.strictEqual(state.successCount, 2, 'Expected Action was not called');
			assert.strictEqual(state.failureCount, 0, 'Unexpected Action was called');
			assert.strictEqual(ifElse.getChildren().length, 3, 'ifElse does not have 3 children');
		});
	});

	context('conditional returns failure (false)', function () {
		it('should return failure when conditional is false and there is no alternative', function () {
			const ifElse = new Behavior.IfElseWithNodeCondition(
				'testIfElse',
				failureAction,
				successAction,
			);

			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.FAILURE, 'Behavior Tree not failure');
			assert.strictEqual(state.successCount, 0, 'Unexpected Action was called');
			assert.strictEqual(state.failureCount, 1, 'Expected Action was not called');
		});

		it('should return success (alternative) when conditional is false with an alternative rc', function () {
			const ifElse = new Behavior.IfElseWithNodeCondition(
				'testIfElse',
				failureAction,
				failureAction,
				rc.SUCCESS,
			);

			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.strictEqual(state.failureCount, 1, 'Expected Action was not called once');
		});

		it('should return success (alternative) when conditional is false with an alternative node', function () {
			const ifElse = new Behavior.IfElseWithNodeCondition(
				'testIfElse',
				failureAction,
				failureAction,
				successAction,
			);

			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.strictEqual(state.successCount, 1, 'Expected Action was not called once');
			assert.strictEqual(state.failureCount, 1, 'Expected Action was not called once');
		});
	});

	context('conditional returns success (true) after running twice', function () {
		it('should return success (consequent) when conditional is true after running with no alternative', function () {
			const condition = new TestRunningAction('testRunningAction');
			const ifElse = new Behavior.IfElseWithNodeCondition('testIfElse', condition, successAction);

			const state = new TestState();
			let res = ifElse.handleEvent(state, 'testEvent');
			assert.strictEqual(res, rc.RUNNING);
			res = ifElse.handleEvent(state, 'testEvent');
			assert.strictEqual(res, rc.RUNNING);
			res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.strictEqual(state.successCount, 1, 'Expected Action was not called once');
			assert.strictEqual(condition.numCalls, 3, 'Condition not called 3 times');
		});

		it('should return success (consequent) when conditional is true after running with alternative rc', function () {
			const condition = new TestRunningAction('testRunningAction');
			const ifElse = new Behavior.IfElseWithNodeCondition(
				'testIfElse',
				condition,
				successAction,
				rc.FAILURE,
			);

			const state = new TestState();
			let res = ifElse.handleEvent(state, 'testEvent');
			assert.strictEqual(res, rc.RUNNING);
			res = ifElse.handleEvent(state, 'testEvent');
			assert.strictEqual(res, rc.RUNNING);
			res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.strictEqual(state.successCount, 1, 'Expected Action was not called once');
			assert.strictEqual(condition.numCalls, 3, 'Condition not called 3 times');
		});

		it('should return success (consequent) when conditional is true after running with alternative node', function () {
			const condition = new TestRunningAction('testRunningAction');
			const ifElse = new Behavior.IfElseWithNodeCondition(
				'testIfElse',
				condition,
				successAction,
				failureAction,
			);

			const state = new TestState();
			let res = ifElse.handleEvent(state, 'testEvent');
			assert.strictEqual(res, rc.RUNNING);
			res = ifElse.handleEvent(state, 'testEvent');
			assert.strictEqual(res, rc.RUNNING);
			res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.strictEqual(state.successCount, 1, 'Expected Action was not called once');
			assert.strictEqual(state.failureCount, 0, 'Unexpected Action was called');
			assert.strictEqual(condition.numCalls, 3, 'Condition not called 3 times');
		});
	});
});
