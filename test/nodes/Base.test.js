/**
 * Created by josh on 1/10/16.
 */
'use strict';

let assert = require('chai').assert;

let Behavior = require('../../lib');
let Base = Behavior.Action;
var Decorator = Behavior.Decorator;

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
			var node = new Base('test');

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

	describe('#getStorage', function() {
		it('has separate storage for each state', function() {
			var node = new Base('test');

			var state1 = {};
			var state2 = {};

			var storage = node.getStorage(state1);

			storage.testData = 'Node Data';

			assert.equal(node.getStorage(state1).testData, 'Node Data', 'Testing Storage');
			assert.ok(node.getStorage(state2), 'state2 storage found');
			assert.notOk(node.getStorage(state2).testData, 'state2 testData not found');
		});
	});

	describe('#handleEvent', function() {
		it('handles events', function() {
			let action = new TestAction();

			let p = action.handleEvent({}, 'testEvent');

			return p.then(res => {
				console.log('TestAction completed', res);
				assert.equal(res.result, 'SUCCESS');
			});
		});
	});
});
