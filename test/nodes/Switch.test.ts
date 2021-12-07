import {assert} from 'chai';
import {Action, BlueshellState, rc, ResultCode, Switch, SwitchEntry} from '../../lib';

class TestAction<S extends BlueshellState, E> extends Action<S, E> {
	public eventCount: number = 0;

	onEvent(state: S, event: E): ResultCode {
		this.eventCount++;
		return rc.SUCCESS;
	}
}

interface TestState extends BlueshellState {
	switchEntryIndex?: number,
}

describe('Switch', function() {
	it('executes the child of the first matching switch entry', function() {
		const testAction0 = new TestAction<TestState, number>('0');
		const testAction1 = new TestAction<TestState, number>('1');
		const testAction2 = new TestAction<TestState, number>('2');

		const switchEntries: SwitchEntry<TestState, number>[] = [
			{
				conditional: (state: TestState, event: number) => state.switchEntryIndex === 0,
				child: testAction0,
			},
			{
				conditional: (state: TestState, event: number) => state.switchEntryIndex === 1,
				child: testAction1,
			},
			{
				conditional: (state: TestState, event: number) => state.switchEntryIndex === 2,
				child: testAction2,
			},
		];

		const uut = new Switch<TestState, number>('uut', switchEntries);

		const state: TestState = {
			__blueshell: {},
			switchEntryIndex: 1,
		};

		const result = uut.handleEvent(state, 1);

		assert.strictEqual(result, rc.SUCCESS);
		assert.strictEqual(testAction0.eventCount, 0);
		assert.strictEqual(testAction1.eventCount, 1);
		assert.strictEqual(testAction2.eventCount, 0);
	});

	it('assumes that a switchEntry with a missing condition always matches', function() {
		const testAction0 = new TestAction<TestState, number>('0');
		const testAction1 = new TestAction<TestState, number>('1');

		const switchEntries: SwitchEntry<TestState, number>[] = [
			{
				conditional: (state: TestState, event: number) => false,
				child: testAction0,
			},
			{
				child: testAction1,
			},
		];

		const uut = new Switch<TestState, number>('uut', switchEntries);

		const state: TestState = {
			__blueshell: {},
			switchEntryIndex: 1,
		};

		const result = uut.handleEvent(state, 1);

		assert.strictEqual(result, rc.SUCCESS);
		assert.strictEqual(testAction0.eventCount, 0);
		assert.strictEqual(testAction1.eventCount, 1);
	});

	it('returns the defaultResult when there are no matching switch entries', function() {
		const switchEntries: SwitchEntry<TestState, number>[] = [];

		const uut = new Switch<TestState, number>('uut', switchEntries, rc.FAILURE);

		const state: TestState = {
			__blueshell: {},
			switchEntryIndex: 1,
		};

		const result = uut.handleEvent(state, 1);

		assert.strictEqual(result, rc.FAILURE);
	});

	it('defaults defaultResult to SUCCESS', function() {
		const switchEntries: SwitchEntry<TestState, number>[] = [];

		const uut = new Switch<TestState, number>('uut', switchEntries);

		const state: TestState = {
			__blueshell: {},
			switchEntryIndex: 1,
		};

		const result = uut.handleEvent(state, 1);

		assert.strictEqual(result, rc.SUCCESS);
	});
});
