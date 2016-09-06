/**
 * Created by josh on 3/23/16.
 */
'use strict';

import {assert} from 'chai';

import * as Blueshell from '../../dist';

import * as TestActions from '../nodes/test/Actions';

let waitAi = TestActions.waitAi;

describe('RenderTree', () => {

	it('should not crash', (done) => {
		Blueshell.toConsole(waitAi);
		done();
	});

	it('should generate a tree of nodes without a state', (done) => {
		let a = Blueshell.renderTree(waitAi);

		assert.ok(a);
		assert.equal(a.indexOf('shutdownWithWaitAi'), 0);

		let expectedWords = [
			'(LatchedSelector)',
			'Recharge',
			'WaitForCooldown',
			'EmergencyShutdown'
		];

		assertWordsInString(a, expectedWords);

		Blueshell.EnumEx.getNames(Blueshell.ResultCodes).forEach((code: string) => {
			assert.notOk(a.includes(code));
		});

		done();
	});

	it('should generate a tree of nodes with state', () => {
		let state = new TestActions.BasicState(false) as any;
		let event = {};

		state.overheated = true;

		return waitAi.handleEvent(state, event)
		.catch((err: any) => {
			console.error(err.stack);
		})
		.then(() => {
			let a = Blueshell.renderTree(waitAi, state);

			assert.ok(a);
			assert.equal(a.indexOf('shutdownWithWaitAi'), 0);

			let expectedWords = [
				'(LatchedSelector)',
				Blueshell.ResultCodes[Blueshell.ResultCodes.RUNNING],
				'Recharge',
				Blueshell.ResultCodes[Blueshell.ResultCodes.FAILURE],
				'WaitForCooldown',
				Blueshell.ResultCodes[Blueshell.ResultCodes.RUNNING],
				'EmergencyShutdown'
			];

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
