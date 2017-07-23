'use strict';

import {assert} from 'chai';

import {
	ResultCodes,
	Base,
	Decorator,
} from '../../lib';

import {BasicState} from './test/Actions';

class TestAction extends Base<BasicState> {
	private preconditionStatus: boolean;

	constructor(name?: string, precond: boolean = true) {
		super(name);
		this.preconditionStatus = precond;
	}

	precondition() {
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
			let node = new Base('test');

			assert.equal(node.path, 'test', 'Node Name');
		});

		it('builds hierarchical paths', function() {
			let leaf = new TestAction('leaf');
			let parent1 = new Decorator('parent1', leaf);
			let parent2 = new Decorator('parent2_foo', parent1);

			let path = leaf.path;
			assert.equal(path, 'parent2_foo_parent1_leaf');

			path = parent1.path;

			assert.equal(path, 'parent2_foo_parent1');
			path = parent2.path;

			assert.equal(path, 'parent2_foo');
		});
	});

	describe('#getNodeStorage', function() {
		it('has separate storage for each state', function() {
			let node = new Base('test');

			let state1: BasicState = new BasicState();
			let state2: BasicState = new BasicState();

			let storage = node.getNodeStorage(state1);

			storage.testData = 'Node Data';

			assert.equal((<any>node).getNodeStorage(state1).testData, 'Node Data', 'Testing Storage');
			assert.ok((<any>node).getNodeStorage(state2), 'state2 storage found');
			assert.notOk((<any>node).getNodeStorage(state2).testData, 'state2 testData not found');
		});
	});

	describe('#run', function() {
		it('handles events', function() {
			let action = new TestAction();

			let state: BasicState = new BasicState();

			return action.run(state)
				.then(res => {
				console.log('TestAction completed', res);
				assert.equal(res, ResultCodes.SUCCESS);
			});
		});
	});

	describe('#EventCounter', function() {
		it('Parent Node Counter', function() {
			let root = new Base('root');
			let state: BasicState = new BasicState();

			return root.run(state)
			.then(() => root.run(state))
			.then(() => {
				assert.equal(root.getTreeEventCounter(state), 2);
			});

		});

		it('Child Node Counter', function() {

			let child = new Base('child');
			let root = new Decorator('root', child);

			let state: BasicState = new BasicState();

			// Since it has a parent, it should increment
			// the local node but not the runCounter
			return root.run(state)
			.then(() => root.run(state))
			.then(() => {
				assert.equal(root.getTreeEventCounter(state), 2);
				assert.equal(child.getTreeEventCounter(state), 2);
			});

		});

	});
});
