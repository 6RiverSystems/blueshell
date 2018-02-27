/**
 * Created by josh on 3/23/16.
 */
import {assert} from 'chai';

import {resultCodes as rc} from '../../lib/utils/resultCodes';

import {renderTree} from '../../lib';
import {RobotState, waitAi} from '../nodes/test/RobotActions';

describe('renderTree', function() {
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
