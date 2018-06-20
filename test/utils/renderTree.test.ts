/**
 * Created by josh on 3/23/16.
 */
import {assert} from 'chai';

import {Base} from '../../lib/nodes/Base';

import {resultCodes as rc} from '../../lib/utils/resultCodes';

import {renderTree} from '../../lib';
import {RobotState, waitAi} from '../nodes/test/RobotActions';
import { BlueshellState } from '../../lib/nodes/BlueshellState';
import { generateDigraphString } from '../../lib/utils/renderTree';

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

	it('should generate a digraph string', function(done) {
		console.log(generateDigraphString(waitAi));
		done();
	});
});

function printNode<S extends BlueshellState, E>(node: Base<S, E>, state?: S): void {
	console.log(`Visited: ${node.name}`);
}

function assertWordsInString(s: string, words: string[]) {
	for (const word of words) {
		const wordPos = s.indexOf(word);

		assert.isAbove(wordPos, 0, 'Expected to find ' + word);

		s = s.substring(wordPos + 1);
	}
}
