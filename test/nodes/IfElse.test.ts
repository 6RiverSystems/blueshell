/**
 * Created by josh on 1/10/16.
 */
import {assert} from 'chai';

import {rc} from '../../lib';
import * as Behavior from '../../lib';

class TestState implements Behavior.BlueshellState {
	public success: boolean = false;
	public failure: boolean = false;
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
			state.failure = true;

			return rc.FAILURE;
		}
	})();

	context('conditional is true', function() {
		it('should return success (consequent) when conditional is true with no alternative', function() {
			const ifElse = new Behavior.IfElse('testIfElse',
				() => true,
				successAction
			);

			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.isTrue(state.success, 'Expected Action was not called');
			assert.isFalse(state.failure, 'Unexpected Action was called');
			assert.strictEqual(ifElse.getChildren().length, 1, 'ifElse does not have 1 child');
		});

		it('should return success (consequent) when conditional is true with an alternative rc', function() {
			const ifElse = new Behavior.IfElse('testIfElse',
				() => true,
				successAction,
				rc.FAILURE,
			);

			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.isTrue(state.success, 'Eexpected Action was not called');
			assert.isFalse(state.failure, 'Unexpected Action was called');
			assert.strictEqual(ifElse.getChildren().length, 2, 'ifElse does not have 2 children');
		});

		it('should return success (consequent) when conditional is true with an alternative node', function() {
			const ifElse = new Behavior.IfElse('testIfElse',
				() => true,
				successAction,
				failureAction
			);

			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
			assert.isTrue(state.success, 'Expected Action was not called');
			assert.isFalse(state.failure, 'Unexpected Action was called');
			assert.strictEqual(ifElse.getChildren().length, 2, 'ifElse does not have 2 children');
		});
	});

	context('conditional is false', function() {
		it('should return failure when conditional is false and there is no alternative', function() {
			const ifElse = new Behavior.IfElse('testIfElse',
				() => false,
				successAction
			);

			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.FAILURE, 'Behavior Tree not failure');
			assert.isFalse(state.success, 'Unexpected Action was called');
		});

		it('should return success (alternative) when conditional is false with an alternative rc', function() {
			const ifElse = new Behavior.IfElse('testIfElse',
				() => false,
				failureAction,
				rc.SUCCESS
			);

			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.isFalse(state.failure, 'Unexpected Action was called');
		});

		it('should return success (alternative) when conditional is false with an alternative node', function() {
			const ifElse = new Behavior.IfElse('testIfElse',
				() => false,
				failureAction,
				successAction
			);

			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');

			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.isTrue(state.success, 'Expected Action was not called');
			assert.isFalse(state.failure, 'Unexpected Action was called');
		});
	});
});
