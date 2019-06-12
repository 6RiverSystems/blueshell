'use strict';

import {assert} from 'chai';

const parse = require('dotparser');


import {
	ResultCodes,
	EnumEx,
	renderTree,
	toDotString,
	toConsole,
	Action,
	LatchedSequence,
	LatchedSelector
} from '../../lib';

import * as TestActions from '../nodes/test/Actions';

let waitAi = TestActions.waitAi;

class ConsumeOnce extends Action<any> {
	onEvent(state: any): ResultCodes {
		const storage = this.getNodeStorage(state);

		if (storage.ateOne) {
			delete storage.ateOne;
			return ResultCodes.SUCCESS;
		} else {
			storage.ateOne = true;
			return ResultCodes.RUNNING;
		}
	}
}

const testTree = new LatchedSequence(
	'root',
	[
		new LatchedSequence(
			'0',
			[
				new LatchedSequence(
					'0.0',
					[
						new ConsumeOnce('0.0.0'),
						new ConsumeOnce('0.0.1'),
					]
				),
				new LatchedSequence(
					'0.1',
					[
						new ConsumeOnce('0.1.0'),
						new ConsumeOnce('0.1.1'),
					]
				),
			]
		),
		new LatchedSequence(
			'1',
			[
				new ConsumeOnce('1.0'),
				new ConsumeOnce('1.1'),
			]
		),
	]
);

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

		EnumEx.getValues(ResultCodes).forEach((value: number) => {
			assert.notOk(value === null);
		});

		EnumEx.getNamesAndValues(ResultCodes).forEach((namesAndValues: any) => {
			assert.notOk(a.includes(namesAndValues.name));
			assert.notOk(namesAndValues.value === null);
		});

		done();
	});

	it('should generate a tree of nodes with state', () => {
		let state = new TestActions.BasicState(false) as any;

		state.overheated = true;

		return waitAi.run(state)
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

	context('dot notation tree', function() {
		function assertParse(s: string) {
			try {
				parse(s);
			} catch (err) {
				// eslint-disable-next-line no-console
				console.log('failed to parse:');
				// eslint-disable-next-line no-console
				console.log(s);
				throw err;
			}
		}

		it('should generate a digraph at context depth 1 after a run', async function() {
			const state = new TestActions.BasicState();
			await testTree.run(state);
			const render = toDotString(testTree, state);
			assertParse(render);
		});

		it('should generate a digraph at context depth -1', async function() {
			const state = new TestActions.BasicState();
			const render = toDotString(testTree, state);
			assertParse(render);
		});

		it('should generate a digraph with no tree', function() {
			assertParse(toDotString(undefined as any));
		});

		it('should generate a digraph at context depth 0 after a run', async function() {
			const state = new TestActions.BasicState();
			await testTree.run(state);
			const render = toDotString(testTree, state);
			assertParse(render);
		});

		it('should generate a dot string without state', function(done) {
			const dotString = toDotString(waitAi);

			assert.notOk(dotString.includes('fillcolor="#4daf4a"')); // SUCCESS
			assert.notOk(dotString.includes('fillcolor="#984ea3"')); // FAILURE
			assert.notOk(dotString.includes('fillcolor="#377eb8"')); // RUNNING
			assert.notOk(dotString.includes('fillcolor="#e41a1c"')); // ERROR
			assertParse(dotString);
			done();
		});

		it('should generate a digraph string with state', function() {
			const state = new TestActions.BasicState();

			state.overheated = true;

			waitAi.run(state);

			const result = toDotString(waitAi, state);

			assert.ok(result);
			assertParse(result);
		});

		it('should generate a digraph with custom node', function(done) {
			const customLSelector = new CustomLatchedSelector();
			const dotString = toDotString(customLSelector);
			assertParse(dotString);
			done();
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

class CustomLatchedSelector extends LatchedSelector<TestActions.BasicState> {
	constructor() {
		super('Custom', []);
	}
}
