/**
 * Created by josh on 1/10/16.
 */
import {assert} from 'chai';
import * as Behavior from '../../lib';
import {BlueshellState} from '../../lib/nodes/BlueshellState';
import {resultCodes as rc} from '../../lib/utils/resultCodes';

const Base = Behavior.Action;
const Decorator = Behavior.Decorator;

class TestState implements BlueshellState {
	public errorReason?: Error;
	public __blueshell: any;
}

class TestAction extends Base<TestState, string> {
	constructor(name?: string, private preconditionStatus = true) {
		super(name);
	}

	async precondition(): Promise<boolean> {
		return this.preconditionStatus;
	}
}

describe('Base', function() {
	describe('#name', function() {
		it('has a name', function() {
			assert.equal(new TestAction().name, 'TestAction');
			assert.equal(new TestAction('override').name, 'override');
		});
	});

	describe('#path', function() {
		it('sets a simple path', function() {
			const node = new Base('test');

			assert.equal(node.path, 'test', 'Node Name');
		});

		it('builds hierarchical paths', function() {
			const leaf = new TestAction('leaf');
			const parent1 = new Decorator('parent1', leaf);
			const parent2 = new Decorator('parent2_foo', parent1);

			assert.ok(parent2);
			assert.equal(leaf.path, 'parent2_foo_parent1_leaf');
			assert.equal(parent1.path, 'parent2_foo_parent1');
		});
	});

	describe('#getNodeStorage', function() {
		it('has separate storage for each state', function() {
			const node = new Base('test');

			const state1 = new TestState();
			const state2 = new TestState();

			const storage = node.getNodeStorage(state1);

			storage.testData = 'Node Data';

			assert.equal(node.getNodeStorage(state1).testData, 'Node Data', 'Testing Storage');
			assert.ok(node.getNodeStorage(state2), 'state2 storage found');
			assert.notOk(node.getNodeStorage(state2).testData, 'state2 testData not found');
		});
	});

	describe('#handleEvent', function() {
		it('handles events', function() {
			const action = new TestAction();

			const p = action.handleEvent(new TestState(), 'testEvent');

			return p.then((res) => {
				console.log('TestAction completed', res);
				assert.equal(res, rc.SUCCESS);
			});
		});
	});

	describe('#precondition', function() {
		it('should return FAILURE if the precondition fails', function() {
			const action = new TestAction('will fail', false);

			const p = action.handleEvent(new TestState(), 'testEvent');

			return p.then((res) => {
				console.log('TestAction completed', res);
				assert.equal(res, rc.FAILURE);
			});
		});

		it('should allow precondition to return a promise', function() {
			class PromiseAction extends TestAction {
				async precondition() {
					return true;
				}
			};

			const action = new PromiseAction();

			const p = action.handleEvent(new TestState(), 'testEvent');

			return p.then((res) => {
				console.log('TestAction completed', res);
				assert.equal(res, rc.SUCCESS);
			});
		});
	});

	describe('#EventCounter', function() {
		it('Parent Node Counter', function() {
			const root = new Base('root');
			const state = new TestState();

			return root.handleEvent(state, {})
			.then(() => root.handleEvent(state, {}))
			.then(() => {
				assert.equal(root.getTreeEventCounter(state), 2);
				assert.equal(root.getLastEventSeen(state), 2);
			});
		});

		it('Child Node Counter', function() {
			const child = new Base('child');
			const root = new Behavior.Decorator('root', child);

			const state = new TestState();

			// Since it has a parent, it should increment
			// the local node but not the eventCounter
			return root.handleEvent(state, {})
			.then(() => root.handleEvent(state, {}))
			.then(() => {
				assert.equal(root.getTreeEventCounter(state), 2);
				assert.equal(root.getLastEventSeen(state), 2);
				assert.equal(child.getTreeEventCounter(state), 2);
				assert.equal(child.getLastEventSeen(state), 2, 'last event seen should be updated');
			});
		});
	});
});
