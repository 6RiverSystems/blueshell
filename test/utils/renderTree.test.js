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

describe('renderTree', function() {

	it('should generate a tree of nodes', function(done) {
		let a = renderTree(waitAi);

		assert.ok(a);
		assert.equal(a.indexOf('shutdownWithWaitAi'), 0);
		assert.isAbove(a.indexOf('LatchedSelector'), 0);
		assert.isAbove(a.indexOf('Recharge'), 0);
		assert.isAbove(a.indexOf('WaitForCooldown'), 0);
		assert.isAbove(a.indexOf('EmergencyShutdown'), 0);

		done();
	});

});
