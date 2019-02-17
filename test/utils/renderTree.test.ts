/**
 * Created by josh on 3/23/16.
 */
import {assert} from 'chai';

const parse = require('dotparser');

import {resultCodes as rc} from '../../lib/utils/resultCodes';

import {renderTree, LatchedSelector} from '../../lib';
import {RobotState, waitAi} from '../nodes/test/RobotActions';

describe('renderTree', function() {
	context('archy tree', function() {
		it('should not crash', function(done) {
			renderTree!.toConsole(waitAi);
			done();
		});

		it('should generate a tree of nodes without a state', function(done) {
			const a = renderTree.toString(waitAi);

			assert.ok(a);
			assert.equal(a.indexOf('shutdownWithWaitAi'), 0);

			const expectedWords = [
				'(LatchedSelector)',
				'Recharge',
				'WaitForCooldown',
				'EmergencyShutdown',
			];

			assertWordsInString(a, expectedWords);
			assert.notOk(a.includes(rc.SUCCESS));
			assert.notOk(a.includes(rc.FAILURE));
			assert.notOk(a.includes(rc.RUNNING));
			assert.notOk(a.includes(rc.ERROR));
			console.log(a);

			done();
		});

		it('should generate a tree of nodes with state', function() {
			const state = new RobotState();
			const event = 'testEvent';

			state.overheated = true;

			waitAi.handleEvent(state, event);

			const a = renderTree.toString(waitAi, state);

			assert.ok(a);
			assert.equal(a.indexOf('shutdownWithWaitAi'), 0);

			const expectedWords = [
				'(LatchedSelector)',
				rc.RUNNING,
				'Recharge',
				rc.FAILURE,
				'WaitForCooldown',
				rc.RUNNING,
				'EmergencyShutdown',
			];

			assertWordsInString(a, expectedWords);
			console.log(a);
		});
	});

	context('dot notation tree', function() {
		it('should not crash', function(done) {
			renderTree!.toDotConsole(waitAi);
			done();
		});
		it('should generate a dot string without state', function(done) {
			const dotString = renderTree.toDotString(waitAi);

			assert.notOk(dotString.includes('fillcolor="#4daf4a"')); // SUCCESS
			assert.notOk(dotString.includes('fillcolor="#984ea3"')); // FAILURE
			assert.notOk(dotString.includes('fillcolor="#377eb8"')); // RUNNING
			assert.notOk(dotString.includes('fillcolor="#e41a1c"')); // ERROR
			console.log(dotString);
			assert.doesNotThrow(function() {
				parse(dotString);
			});
			done();
		});

		it('should generate a digraph string with state', function() {
			const state = new RobotState();
			const event = 'testEvent';

			state.overheated = true;

			waitAi.handleEvent(state, event);

			const result = renderTree.toDotString(waitAi, state);

			assert.ok(result);
			console.log(result);
			assert.doesNotThrow(function() {
				parse(result);
			});
		});

		it('should generate a digraph with custom node', function(done) {
			const customLSelector = new CustomLatchedSelector();
			const dotString = renderTree.toDotString(customLSelector);
			console.log(dotString);
			assert.doesNotThrow(function() {
				parse(dotString);
			});
			done();
		});
	});
});

function assertWordsInString(s: string, words: string[]) {
	for (const word of words) {
		const wordPos = s.indexOf(word);

		assert.isAbove(wordPos, 0, 'Expected to find ' + word);

		s = s.substring(wordPos + 1);
	}
}

class CustomLatchedSelector extends LatchedSelector<RobotState, string> {
	constructor() {
		super('Custom', []);
	}
}
