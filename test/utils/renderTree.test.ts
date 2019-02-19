/**
 * Created by josh on 3/23/16.
 */
import {assert} from 'chai';
import * as parse from 'dotparser';

import {resultCodes as rc} from '../../lib/utils/resultCodes';

import {renderTree, LatchedSelector, LatchedSequence, Action} from '../../lib';
import {RobotState, waitAi} from '../nodes/test/RobotActions';
import {BlueshellState} from '../../lib/nodes/BlueshellState';

class ConsumeOnce extends Action<any, any> {
	async onEvent(state: any, event: any): Promise<string> {
		const storage = this.getNodeStorage(state);

		if (storage.ateOne) {
			delete storage.ateOne;
			return rc.SUCCESS;
		} else {
			storage.ateOne = true;
			return rc.RUNNING;
		}
	}
}

describe('renderTree', function() {
	context('archy tree', function() {
		context('contextDepth', function() {
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
			let state: BlueshellState = {
				errorReason: undefined,
				__blueshell: {},
			};
			beforeEach(function() {
				state = {
					errorReason: undefined,
					__blueshell: {},
				};
			});
			function runContextDepthTest(
				contextDepth: number,
				expectedNodes: number,
				expectedEllipses: number,
				expectedArrows: number
			) {
				const render = renderTree!.toString(testTree, state, contextDepth);

				const nodesShown = render.split('\n').length - 1;
				const ellipsesShown = getCount(/\.\.\./g);
				const arrowsShown = getCount(/=>/g);

				assert.strictEqual(nodesShown, expectedNodes, 'nodes:\n' + render);
				assert.strictEqual(ellipsesShown, expectedEllipses, 'ellipses:\n' + render);
				assert.strictEqual(arrowsShown, expectedArrows, 'arrows:\n' + render);

				function getCount(re: RegExp) {
					const matches = render.match(re);
					return matches && matches.length || 0;
				}
			}
			context('before running', function() {
				it('should show everything at unspecified context depth', function() {
					runContextDepthTest(undefined, 11, 0, 0);
				});
				it('should show nothing at -1 context depth', function() {
					runContextDepthTest(-1, 0, 0, 0);
				});
				it('should show root ellipsis at 0 context depth', function() {
					runContextDepthTest(0, 1, 1, 0);
				});
			});
			context('after one run', function() {
				beforeEach(async function() {
					await testTree.handleEvent(state, {});
				});
				it('should arrow the first path at unspecified context depth', function() {
					runContextDepthTest(undefined, 11, 0, 4);
				});
				it('should show only the active path at -1 context depth', function() {
					runContextDepthTest(-1, 4, 0, 4);
				});
				// eslint-disable-next-line max-len
				it('should show only the active path, terminal context-boundaries, and ellipses at 0 context depth', function() {
					runContextDepthTest(0, 7, 2, 4);
				});
				it('should show everything at 1 context depth', function() {
					runContextDepthTest(1, 11, 0, 4);
				});
			});
		});
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

			return waitAi.handleEvent(state, event)
			.catch((err) => {
				console.error(err.stack);
			})
			.then(() => {
				const result = renderTree.toDotString(waitAi, state);

				assert.ok(result);
				console.log(result);
				assert.doesNotThrow(function() {
					parse(result);
				});
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
