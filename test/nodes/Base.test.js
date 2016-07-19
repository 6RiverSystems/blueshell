/**
 * Created by josh on 1/10/16.
 */
'use strict';

let assert = require('chai').assert;

let rc = require('../../lib/utils/resultCodes');
let Behavior = require('../../lib');
let Base = Behavior.Action;
let Decorator = Behavior.Decorator;

class TestAction extends Base {

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
			let parent2 = new Decorator('parent2', parent1);

			assert.equal(leaf.path, 'parent2.parent1.leaf');
			assert.equal(parent1.path, 'parent2.parent1');
		});
	});

	describe('#getNodeStorage', function() {
		it('has separate storage for each state', function() {
			let node = new Base('test');

			let state1 = {};
			let state2 = {};

			let storage = node.getNodeStorage(state1);

			storage.testData = 'Node Data';

			assert.equal(node.getNodeStorage(state1).testData, 'Node Data', 'Testing Storage');
			assert.ok(node.getNodeStorage(state2), 'state2 storage found');
			assert.notOk(node.getNodeStorage(state2).testData, 'state2 testData not found');
		});
	});

	describe('#handleEvent', function() {
		it('handles events', function() {
			let action = new TestAction();

			let p = action.handleEvent({}, 'testEvent');

			return p.then(res => {
				console.log('TestAction completed', res);
				assert.equal(res, rc.SUCCESS);
			});
		});
	});

	describe('#EventCounter', function() {
		it('Parent Node Counter', function() {
			let root = new Base('root');
			let state = {};

			return root.handleEvent(state, {})
			.then(() => root.handleEvent(state, {}))
			.then(() => {
				assert.equal(root.getTreeEventCounter(state), 2);
				assert.equal(root.getLastEventSeen(state), 2);
			});

		});

		it('Child Node Counter', function() {

			let child = new Base('child');
			let root = new Behavior.Decorator('root', child);

			let state = {};

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
