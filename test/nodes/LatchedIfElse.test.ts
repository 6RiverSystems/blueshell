/**
 * Created by josh on 1/10/16.
 */
import {assert} from 'chai';
import {rc, ResultCode} from '../../lib';
import * as Behavior from '../../lib';
class TestState implements Behavior.BlueshellState {
	public calledMap: Map<ResultCode, boolean> = new Map();
	public runCounter: number = 0;
	public errorReason?: Error;
	public __blueshell: any;
}

class LatchedAction extends Behavior.Action<TestState, string> {
	private runCounter: number = 0;

	constructor(
		name?: string,
		private numRunning: number = 0,
		private retVal: ResultCode = rc.SUCCESS,
	) {
		super(name);
	}

	onEvent(state: TestState) {
		this.runCounter++;
		state.runCounter = this.runCounter;
		if (this.runCounter < this.numRunning) {
			return rc.RUNNING;
		} else {
			state.calledMap.set(this.retVal, true);
			return this.retVal;
		}
	}

	public resetCounter() {
		this.runCounter = 0;
	}
}

describe('LatchedIfElse', function() {
	let state: TestState;

	beforeEach(function() {
		state = new TestState();
	});

	context('conditional is true', function() {
		it('should return success (consequent) when conditional is true with no alternative (1x)', function() {
			const successAction = new LatchedAction('testLatchedAction', 1, rc.SUCCESS);
			const ifElse = new Behavior.LatchedIfElse('testLatchedIfElse',
				(state) => {
					return state.runCounter === 0;
				},
				successAction,
			);
			let res = ifElse.handleEvent(state, 'testEvent');
			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.isTrue(state.calledMap.get(rc.SUCCESS), 'Expected Action was not called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 1, 'Run counter was not incremented');
			successAction.resetCounter();
			state.calledMap.clear();
			state.runCounter = 0;
			res = ifElse.handleEvent(state, 'testEvent');
			assert.equal(res, rc.SUCCESS, '2nd behavior tree not success');
			assert.isTrue(state.calledMap.get(rc.SUCCESS), 'Expected Action was not called');
			assert.strictEqual(state.runCounter, 1, 'Run counter was not incremented');
		});
		it('should return success (consequent) when conditional is true with alternative (2x)', function() {
			const successAction = new LatchedAction('testLatchedAction', 2, rc.SUCCESS);
			const ifElse = new Behavior.LatchedIfElse('testLatchedIfElse',
				(state) => {
					return state.runCounter === 0;
				},
				successAction,
				new LatchedAction('testLatchedActionFailure', 1, rc.FAILURE),
			);
			let res = ifElse.handleEvent(state, 'testEvent');
			assert.notOk(state.errorReason);
			assert.equal(res, rc.RUNNING, 'Behavior Tree not running');
			assert.isUndefined(state.calledMap.get(rc.SUCCESS), 'Unexpected Action was called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 1, 'Run counter was not incremented');
			res = ifElse.handleEvent(state, 'testEvent');
			assert.equal(res, rc.SUCCESS, '2nd Behavior Tree not success');
			assert.isTrue(state.calledMap.get(rc.SUCCESS), 'Unexpected Action was called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 2, 'Run counter was not incremented');
			successAction.resetCounter();
			state.calledMap.clear();
			state.runCounter = 0;
			res = ifElse.handleEvent(state, 'testEvent');
			assert.notOk(state.errorReason);
			assert.equal(res, rc.RUNNING, '3rd Behavior Tree not running');
			assert.isUndefined(state.calledMap.get(rc.SUCCESS), 'Unexpected Action was called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 1, 'Run counter was not incremented');
			res = ifElse.handleEvent(state, 'testEvent');
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.isTrue(state.calledMap.get(rc.SUCCESS), 'Unexpected Action was called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 2, 'Run counter was not incremented');
			assert.equal(res, rc.SUCCESS, '4th behavior tree not success');
		});

		it('should restart latching if resetNodeStorage is called', function() {
			const successAction = new LatchedAction('testLatchedAction', 2, rc.SUCCESS);
			const ifElse = new Behavior.LatchedIfElse('testLatchedIfElse',
				(state) => {
					return state.runCounter === 0;
				},
				successAction,
				new LatchedAction('testLatchedActionFailure', 1, rc.FAILURE),
			);
			let res = ifElse.handleEvent(state, 'testEvent');
			assert.notOk(state.errorReason);
			assert.equal(res, rc.RUNNING, 'Behavior Tree not running');
			assert.isUndefined(state.calledMap.get(rc.SUCCESS), 'Unexpected Action was called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 1, 'Run counter was not incremented');
			ifElse.resetNodeStorage(state);
			successAction.resetCounter();
			state.runCounter = 0;
			res = ifElse.handleEvent(state, 'testEvent');
			assert.notOk(state.errorReason);
			assert.equal(res, rc.RUNNING, '2nd Behavior Tree not running');
			assert.isUndefined(state.calledMap.get(rc.SUCCESS), 'Unexpected Action was called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 1, 'Run counter was not incremented');
			res = ifElse.handleEvent(state, 'testEvent');
			assert.equal(res, rc.SUCCESS, '3rd Behavior Tree not success');
			assert.isTrue(state.calledMap.get(rc.SUCCESS), 'Unexpected Action was called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 2, 'Run counter was not incremented');
		});
	});

	context('conditional is false', function() {
		it('should return failure when conditional is false and there is no alternative', function() {
			const ifElse = new Behavior.IfElse('testIfElse',
				() => false,
				new LatchedAction('testLatchedAction', 1, rc.SUCCESS),
			);
			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');
			assert.notOk(state.errorReason);
			assert.equal(res, rc.FAILURE, 'Behavior Tree not failure');
			assert.isUndefined(state.calledMap.get(rc.SUCCESS), 'Unexpected Action was called');
		});

		it('should return failure (alternative) when conditional is false with an alternative rc', function() {
			const ifElse = new Behavior.LatchedIfElse('testIfElse',
				() => false,
				new LatchedAction('testLatchedAction', 1, rc.SUCCESS),
				rc.FAILURE,
			);
			const state = new TestState();
			const res = ifElse.handleEvent(state, 'testEvent');
			assert.notOk(state.errorReason);
			assert.equal(res, rc.FAILURE, 'Behavior Tree not failure');
			assert.isUndefined(state.calledMap.get(rc.SUCCESS), 'Unexpected Action was called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 0, 'Run counter was incremented');
		});

		it('should return success (alternative) when conditional is false with an alternative node (1x)', function() {
			const successAction = new LatchedAction('testLatchedAction', 1, rc.SUCCESS);
			const ifElse = new Behavior.LatchedIfElse('testLatchedIfElse',
				(state) => {
					return state.runCounter !== 0;
				},
				new LatchedAction('testLatchedActionFailure', 1, rc.FAILURE),
				successAction,
			);
			let res = ifElse.handleEvent(state, 'testEvent');
			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.isTrue(state.calledMap.get(rc.SUCCESS), 'Expected Action was not called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 1, 'Run counter was not incremented');
			successAction.resetCounter();
			state.calledMap.clear();
			state.runCounter = 0;
			res = ifElse.handleEvent(state, 'testEvent');
			assert.equal(res, rc.SUCCESS, '2nd behavior tree not success');
			assert.isTrue(state.calledMap.get(rc.SUCCESS), 'Expected Action was not called');
			assert.strictEqual(state.runCounter, 1, 'Run counter was not incremented');
		});

		it('should return success (alternative) when conditional is false with an alternative node (2x)', function() {
			const successAction = new LatchedAction('testLatchedAction', 2, rc.SUCCESS);
			const ifElse = new Behavior.LatchedIfElse('testLatchedIfElse',
				(state) => {
					return state.runCounter !== 0;
				},
				new LatchedAction('testLatchedActionFailure', 1, rc.FAILURE),
				successAction,
			);
			let res = ifElse.handleEvent(state, 'testEvent');
			assert.notOk(state.errorReason);
			assert.equal(res, rc.RUNNING, 'Behavior Tree not running');
			assert.isUndefined(state.calledMap.get(rc.SUCCESS), 'Unexpected Action was called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 1, 'Run counter was not incremented');
			res = ifElse.handleEvent(state, 'testEvent');
			assert.equal(res, rc.SUCCESS, '2nd Behavior Tree not success');
			assert.isTrue(state.calledMap.get(rc.SUCCESS), 'Unexpected Action was called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 2, 'Run counter was not incremented');
			successAction.resetCounter();
			state.calledMap.clear();
			state.runCounter = 0;
			res = ifElse.handleEvent(state, 'testEvent');
			assert.notOk(state.errorReason);
			assert.equal(res, rc.RUNNING, '3rd Behavior Tree not running');
			assert.isUndefined(state.calledMap.get(rc.SUCCESS), 'Unexpected Action was called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 1, 'Run counter was not incremented');
			res = ifElse.handleEvent(state, 'testEvent');
			assert.equal(res, rc.SUCCESS, 'Behavior Tree not success');
			assert.isTrue(state.calledMap.get(rc.SUCCESS), 'Unexpected Action was called');
			assert.isUndefined(state.calledMap.get(rc.FAILURE), 'Unexpected Action was called');
			assert.strictEqual(state.runCounter, 2, 'Run counter was not incremented');
			assert.equal(res, rc.SUCCESS, '4th behavior tree not success');
		});
	});
});
