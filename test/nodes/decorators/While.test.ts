import { assert } from 'chai';

import { Action, BlueshellState, rc, ResultCode, decorators } from '../../../lib';

class TestAction extends Action<TestState, number> {
	public eventCount = 0;
	private currentSequenceIdx = 0;

	constructor(
		name?: string,
		private readonly sequence: { rc: ResultCode; inc: boolean }[] = [{ rc: rc.SUCCESS, inc: true }],
	) {
		super(name);
	}

	onEvent(state: TestState, event: number): ResultCode {
		this.eventCount++;

		const sequenceEntry = this.sequence[this.currentSequenceIdx];

		if (sequenceEntry.inc) {
			state.counter++;
		}

		this.incrementCurrentResultSequenceIdx();
		return sequenceEntry.rc;
	}

	private incrementCurrentResultSequenceIdx(): void {
		if (++this.currentSequenceIdx >= this.sequence.length) {
			this.currentSequenceIdx = 0;
		}
	}
}

interface TestState extends BlueshellState {
	counter: number;
}

describe('While', function () {
	it('executes the child action until condition is met and returns the child result', function () {
		const testAction = new TestAction('testAction', [{ rc: rc.FAILURE, inc: true }]);

		const uut = new decorators.While<TestState, number>(
			'uut',
			(state: TestState, event: number) => {
				return state.counter < 1;
			},
			testAction,
		);

		const state: TestState = {
			__blueshell: {},
			counter: 0,
		};

		const result = uut.handleEvent(state, 0);

		assert.strictEqual(rc.FAILURE, result);
		assert.strictEqual(state.counter, 1);
		assert.strictEqual(testAction.eventCount, 1);
	});

	it('returns defaultResult when the condition is already met', function () {
		const testAction = new TestAction();

		const uut = new decorators.While<TestState, number>(
			'uut',
			(state: TestState, event: number) => {
				return state.counter < 1;
			},
			testAction,
			rc.FAILURE,
		);

		const state: TestState = {
			__blueshell: {},
			counter: 1,
		};

		const result = uut.handleEvent(state, 0);

		assert.strictEqual(rc.FAILURE, result);
		assert.strictEqual(state.counter, 1);
		assert.strictEqual(testAction.eventCount, 0);
	});

	it('defaults defaultResult to SUCCESS', function () {
		const testAction = new TestAction();

		const uut = new decorators.While<TestState, number>(
			'uut',
			(state: TestState, event: number) => {
				return state.counter < 1;
			},
			testAction,
		);

		const state: TestState = {
			__blueshell: {},
			counter: 1,
		};

		const result = uut.handleEvent(state, 0);

		assert.strictEqual(rc.SUCCESS, result);
		assert.strictEqual(state.counter, 1);
		assert.strictEqual(testAction.eventCount, 0);
	});

	it('latches', function () {
		const testAction = new TestAction('testAction', [
			{ rc: rc.RUNNING, inc: false },
			{ rc: rc.SUCCESS, inc: true },
		]);

		const uut = new decorators.While<TestState, number>(
			'uut',
			(state: TestState, event: number) => {
				return state.counter < 3;
			},
			testAction,
		);

		const state: TestState = {
			__blueshell: {},
			counter: 0,
		};

		let result = uut.handleEvent(state, 0);
		assert.strictEqual(rc.RUNNING, result);
		assert.strictEqual(state.counter, 0);
		assert.strictEqual(testAction.eventCount, 1);

		result = uut.handleEvent(state, 0);
		assert.strictEqual(rc.RUNNING, result);
		assert.strictEqual(state.counter, 1);
		assert.strictEqual(testAction.eventCount, 3);

		result = uut.handleEvent(state, 0);
		assert.strictEqual(rc.RUNNING, result);
		assert.strictEqual(state.counter, 2);
		assert.strictEqual(testAction.eventCount, 5);

		result = uut.handleEvent(state, 0);
		assert.strictEqual(rc.SUCCESS, result);
		assert.strictEqual(state.counter, 3);
		assert.strictEqual(testAction.eventCount, 6);
	});
});
