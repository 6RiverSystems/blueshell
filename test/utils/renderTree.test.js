/**
 * Created by josh on 3/23/16.
 */
'use strict';

let assert = require('chai').assert;

let rc = require('../../lib/utils/ResultCodes');
let Behavior = require('../../lib');
let renderTree = require('../../lib/utils/renderTree');

let TestActions = require('../nodes/test/Actions');

let waitAi = TestActions.waitAi;

describe('renderTree', function() {

	it('should not crash', function(done) {
		renderTree.toConsole(waitAi);
		done();
	});

	it('should generate a tree of nodes without a state', function(done) {
		let a = renderTree(waitAi);

		assert.ok(a);
		assert.equal(a.indexOf('shutdownWithWaitAi'), 0);

		let expectedWords = [
			'(LatchedSelector)',
			'Recharge',
			'WaitForCooldown',
			'EmergencyShutdown'
		];

		assertWordsInString(a, expectedWords);
		assert.notOk(a.includes(rc.SUCCESS));
		assert.notOk(a.includes(rc.FAILURE));
		assert.notOk(a.includes(rc.RUNNING));
		assert.notOk(a.includes(rc.ERROR));

		done();
	});

	it('should generate a tree of nodes with state', function() {
		let state = TestActions.initialState(false);
		let event = {};

		state.overheated = true;

		return waitAi.handleEvent(state, event)
		.catch((err) => {
			console.error(err.stack);
		})
		.then(() => {
			let a = renderTree(waitAi, state);

			assert.ok(a);
			assert.equal(a.indexOf('shutdownWithWaitAi'), 0);

			let expectedWords = [
				'(LatchedSelector)',
				rc.RUNNING,
				'Recharge',
				rc.FAILURE,
				'WaitForCooldown',
				rc.RUNNING,
				'EmergencyShutdown'
			];

			assertWordsInString(a, expectedWords);
		});
	});

});

function assertWordsInString(s, words) {

	for (let word of words) {
		let wordPos = s.indexOf(word);

		assert.isAbove(wordPos, 0, 'Expected to find ' + word);

		s = s.substring(wordPos + 1);
	}
}
