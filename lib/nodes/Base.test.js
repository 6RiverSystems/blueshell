/**
 * Created by josh on 1/10/16.
 */
'use strict';

var test = require('tape');

var Base = require('./Base');

test('Base Name', function(assert) {

	var node = new Base('test');

	assert.equal(node.path, 'test', 'Node Name');

	assert.end();
});

test('Path Construction', function(assert) {
	let leaf = new TestAction('leaf');
	let parent1 = new TestAction('parent1');
	let parent2 = new TestAction('parent2');

	leaf.parent = parent1;
	parent1.parent = parent2;

	assert.equal(leaf.path, 'parent2.parent1.leaf');
	assert.equal(parent1.path, 'parent2.parent1');

	assert.end();
});


test('Base Storage Differentiation', function(assert) {

	var node = new Base('test');

	var state1 = {};
	var state2 = {};

	var storage = node.getStorage(state1);

	storage.testData = 'Node Data';

	assert.equal(node.getStorage(state1).testData, 'Node Data', 'Testing Storage');
	assert.ok(node.getStorage(state2), 'state2 storage found');
	assert.notOk(node.getStorage(state2).testData, 'state2 testData not found');

	assert.end();

});

class TestAction extends Base {

}

test('Extended Name', function(assert) {

	assert.equal(new TestAction().name, 'TestAction');
	assert.equal(new TestAction('override').name, 'override');

	assert.end();

});

test('Handle Event', function(assert) {

	let action = new TestAction();

	let p = action.handleEvent({}, 'testEvent');

	p.then(res => {
		console.log('TestAction completed', res);
		assert.equal(res.result, 'SUCCESS');
		assert.end();
	});

});
