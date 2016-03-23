/**
 * Created by josh on 3/23/16.
 */
'use strict';

let assert = require('chai').assert;

let Behavior = require('../../lib');
let renderTree = require('../../lib/utils/renderTree');

var TestActions = require('../nodes/test/Actions');

let waitAi = new Behavior.LatchedSelector('shutdownWithWaitAi',
	[
		new TestActions.Recharge(),
		new TestActions.WaitForCooldown(),
		new TestActions.EmergencyShutdown()
	]);

describe.only('renderTree', function() {

	it('should generate a tree of nodes', function() {
		renderTree(waitAi);
	});

});
