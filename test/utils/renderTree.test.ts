/**
 * Created by josh on 3/23/16.
 */
'use strict';

import {assert} from 'chai';

import {
	ResultCodes,
	EnumEx,
	renderTree,
	toConsole
} from '../../lib';

import * as TestActions from '../nodes/test/Actions';

let waitAi = TestActions.waitAi;

describe('RenderTree', () => {

	it('should not crash', (done) => {
		toConsole(waitAi);
		done();
	});

	it('should generate a tree of nodes without a state', (done) => {
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

		EnumEx.getNames(ResultCodes).forEach((code: string) => {
			assert.notOk(a.includes(code));
		});

		done();
	});

	it('should generate a tree of nodes with state', () => {
		let state = new TestActions.BasicState(false) as any;

		state.overheated = true;

		return waitAi.handleEvent(state, {})
		.catch((err: any) => {
			console.error(err.stack);
		})
		.then(() => {
			let a = renderTree(waitAi, state);

			assert.ok(a);
			assert.equal(a.indexOf('shutdownWithWaitAi'), 0);

			let expectedWords = [
				'(LatchedSelector)',
				ResultCodes[ResultCodes.RUNNING],
				'Recharge',
				ResultCodes[ResultCodes.FAILURE],
				'WaitForCooldown',
				ResultCodes[ResultCodes.RUNNING],
				'EmergencyShutdown'
			];

			console.log(a);

			assertWordsInString(a, expectedWords);
		});
	});

});

function assertWordsInString(s: string, words: string[]) {

	for (let word of words) {
		let wordPos = s.indexOf(word);

		assert.isAbove(wordPos, 0, 'Expected to find ' + word);

		s = s.substring(wordPos + 1);
	}
}
