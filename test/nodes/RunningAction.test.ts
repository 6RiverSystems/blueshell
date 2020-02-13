/**
 * Created by josh on 1/10/16.
 */
import {assert} from 'chai';
import * as sinon from 'sinon';

import {rc} from '../../lib';
import * as Behavior from '../../lib';

const RunningAction = Behavior.RunningAction;

class TestState implements Behavior.BlueshellState {
	public errorReason?: Error;
	public __blueshell: any;
}

class TestAction extends RunningAction<TestState, string> {
	private count = 0;

	constructor(
		name: string,
		private readonly numIter: number = 0,
		private readonly actiavteReturns: Behavior.ResultCode = rc.RUNNING,
		private readonly testValue?: string,
	) {
		super(name);
	}

	activate() {
		this.count = 0;
		return this.actiavteReturns;
	}

	protected isCompletionEvent(event: string) {
		this.count++;
		return (this.count === this.numIter || event === this.testValue);
	}
}

describe('RunningAction', function() {
	let action: TestAction;
	let state: TestState;
	let activateSpy: sinon.SinonSpy;
	let isCompletionEventSpy: sinon.SinonSpy;
	let onCompleteSpy: sinon.SinonSpy;
	let onIncompleteSpy: sinon.SinonSpy;

	function setupSpies() {
		activateSpy = sinon.spy(action, 'activate');
		isCompletionEventSpy = sinon.spy(<any>action, 'isCompletionEvent');
		onCompleteSpy = sinon.spy(<any>action, 'onComplete');
		onIncompleteSpy = sinon.spy(<any>action, 'onIncomplete');
	}

	beforeEach(function() {
		state = new TestState();
	});

	afterEach(function() {
		sinon.restore();
	});

	context('Activate returns non-RUNNING on first handleEvent call', function() {
		it('returns SUCCESS', function() {
			action = new TestAction('TestRunningAction', undefined, rc.SUCCESS);
			setupSpies();
			const res = action.handleEvent(state, 'foo');
			assert.strictEqual(res, rc.SUCCESS, 'result on first handleEvent was not success');
			assert.strictEqual(activateSpy.callCount, 1, 'activate not called once');
			assert.strictEqual(isCompletionEventSpy.callCount, 0, 'isCompleteionEvent called');
			assert.strictEqual(onCompleteSpy.callCount, 0, 'onComplete called');
			assert.strictEqual(onIncompleteSpy.callCount, 0, 'onIncomplete called');
		});
		it('returns FAILURE', function() {
			action = new TestAction('TestRunningAction', undefined, rc.FAILURE);
			setupSpies();
			const res = action.handleEvent(state, 'foo');
			assert.strictEqual(res, rc.FAILURE, 'result on first handleEvent was not failure');
			assert.strictEqual(activateSpy.callCount, 1, 'activate not called once');
			assert.strictEqual(isCompletionEventSpy.callCount, 0, 'isCompleteionEvent called');
			assert.strictEqual(onCompleteSpy.callCount, 0, 'onComplete called');
			assert.strictEqual(onIncompleteSpy.callCount, 0, 'onIncomplete called');
		});
		it('returns ERROR', function() {
			action = new TestAction('TestRunningAction', undefined, rc.ERROR);
			setupSpies();
			const res = action.handleEvent(state, 'foo');
			assert.strictEqual(res, rc.ERROR, 'result on first handleEvent was not error');
			assert.strictEqual(activateSpy.callCount, 1, 'activate not called once');
			assert.strictEqual(isCompletionEventSpy.callCount, 0, 'isCompleteionEvent called');
			assert.strictEqual(onCompleteSpy.callCount, 0, 'onComplete called');
			assert.strictEqual(onIncompleteSpy.callCount, 0, 'onIncomplete called');
		});
	});

	context('RUNNING tests', function() {
		it('returns after second handleEvent', function() {
			action = new TestAction('TestRunningAction', 1);
			setupSpies();
			let res = action.handleEvent(state, 'foo');
			assert.strictEqual(res, rc.RUNNING, 'first handleEvent not RUNNING');
			res = action.handleEvent(state, 'foo');
			assert.strictEqual(res, rc.SUCCESS, 'second handleEvent not SUCCESS');
			assert.strictEqual(activateSpy.callCount, 1, 'activate not called once');
			assert.strictEqual(isCompletionEventSpy.callCount, 1, 'isCompleteionEvent not called once');
			assert.strictEqual(onCompleteSpy.callCount, 1, 'onComplete not called once');
			assert.strictEqual(onIncompleteSpy.callCount, 0, 'onIncomplete called');
		});
		it('returns after second handleEvent', function() {
			action = new TestAction('TestRunningAction', 2);
			setupSpies();
			let res = action.handleEvent(state, 'foo');
			assert.strictEqual(res, rc.RUNNING, 'first handleEvent not RUNNING');
			res = action.handleEvent(state, 'foo');
			assert.strictEqual(res, rc.RUNNING, 'second handleEvent not RUNNING');
			res = action.handleEvent(state, 'foo');
			assert.strictEqual(res, rc.SUCCESS, 'third handleEvent not SUCCESS');
			assert.strictEqual(activateSpy.callCount, 1, 'activate not called once');
			assert.strictEqual(isCompletionEventSpy.callCount, 2, 'isCompleteionEvent not called twice');
			assert.strictEqual(onCompleteSpy.callCount, 1, 'onComplete not called once');
			assert.strictEqual(onIncompleteSpy.callCount, 1, 'onIncomplete not called once');
		});
	});

	context('additional tests', function() {
		it('can use event to determine completion', function() {
			action = new TestAction('TestRunningAction', 100, rc.RUNNING, 'bar');
			setupSpies();
			let res = action.handleEvent(state, 'foo');
			assert.strictEqual(res, rc.RUNNING, 'first handleEvent not RUNNING');
			res = action.handleEvent(state, 'foo');
			assert.strictEqual(res, rc.RUNNING, 'second handleEvent not RUNNING');
			res = action.handleEvent(state, 'bar');
			assert.strictEqual(res, rc.SUCCESS, 'third handleEvent not SUCCESS');
			assert.strictEqual(activateSpy.callCount, 1, 'activate not called once');
			assert.strictEqual(isCompletionEventSpy.callCount, 2, 'isCompleteionEvent not called twice');
			assert.strictEqual(onCompleteSpy.callCount, 1, 'onComplete not called once');
			assert.strictEqual(onIncompleteSpy.callCount, 1, 'onIncomplete not called once');
		});
		it('resets when resetNodeStorage() is called', function() {
			action = new TestAction('TestRunningAction', 100, rc.RUNNING, 'bar');
			setupSpies();
			let res = action.handleEvent(state, 'foo');
			assert.strictEqual(res, rc.RUNNING, 'first handleEvent not RUNNING');
			action.resetNodeStorage(state);
			res = action.handleEvent(state, 'foo');
			assert.strictEqual(res, rc.RUNNING, 'second handleEvent not RUNNING');
			res = action.handleEvent(state, 'bar');
			assert.strictEqual(res, rc.SUCCESS, 'third handleEvent not SUCCESS');
			assert.strictEqual(activateSpy.callCount, 2, 'activate not called twice');
			assert.strictEqual(isCompletionEventSpy.callCount, 1, 'isCompleteionEvent not called twice');
			assert.strictEqual(onCompleteSpy.callCount, 1, 'onComplete not called once');
			assert.strictEqual(onIncompleteSpy.callCount, 0, 'onIncomplete called');
		});
	});
});
