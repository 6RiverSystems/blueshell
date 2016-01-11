/**
 * Created by josh on 1/10/16.
 */
'use strict';

var test = require('tape');

var Base = require('./Base');

test('Base Path Test', function(t) {

	var node = new Base('test');

	t.equal(node.path, 'test', 'Node Name');

	node.parent = 'root';

	t.equal(node.path, 'root.test', 'Node Name With Parent');

	var state1 = {};
	var state2 = {};

	var storage = node.getStorage(state1);

	storage.testData = 'Node Data';

	t.equal(node.getStorage(state1).testData, 'Node Data', 'Testing Storage');
	t.ok(node.getStorage(state2), 'state2 storage found');
	t.notOk(node.getStorage(state2).testData, 'state2 testData not found');

	t.end();

});
