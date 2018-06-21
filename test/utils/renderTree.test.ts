/**
 * Created by josh on 3/23/16.
 */
import {assert} from 'chai';


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

			return waitAi.handleEvent(state, event)
			.catch((err) => {
				console.error(err.stack);
			})
			.then(() => {
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
	});

	context('dot notation tree', function() {
		it('should not crash', function(done) {
			renderTree!.toDotConsole(waitAi);
			done();
		});
		it('should generate a dot string without state', function(done) {
			const dotString = renderTree.toDotString(waitAi);

			const expectedWords = [
				'shutdownWithWaitAi',
				'Recharge',
				'WaitForCooldown',
				'EmergencyShutdown',
			];

			assertWordsInString(dotString, expectedWords);
			assert.notOk(dotString.includes('colorscheme=set14 fillcolor=3')); // SUCCESS
			assert.notOk(dotString.includes('colorscheme=set14 fillcolor=4')); // FAILURE
			assert.notOk(dotString.includes('colorscheme=set14 fillcolor=2')); // RUNNING
			assert.notOk(dotString.includes('colorscheme=set14 fillcolor=1')); // ERROR
			console.log(dotString);
			done();
		});

		it('should generate a digraph string with state', function() {
			const state = new RobotState();
			const event = 'testEvent';

			state.overheated = true;

			return waitAi.handleEvent(state, event)
			.catch((err) => {
				console.error(err.stack);
			})
			.then(() => {
				const result = renderTree.toDotString(waitAi, state);

				assert.ok(result);

				const expectedWords = [
					'shutdownWithWaitAi',
					'colorscheme=set14 fillcolor=2', // RUNNING
					'Recharge',
					'colorscheme=set14 fillcolor=4', // FAILURE
					'WaitForCooldown',
					'colorscheme=set14 fillcolor=2', // RUNNING
					'EmergencyShutdown',
					'colorscheme=X11 fillcolor=gray90', // DEFAULT
				];

				assertWordsInString(result, expectedWords);
				console.log(result);
			});
		});

		it('should generate a digraph with custom node', function(done) {
			const customLSelector = new CustomLatchedSelector();
			const dotString = renderTree.toDotString(customLSelector);
			console.log(dotString);
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
