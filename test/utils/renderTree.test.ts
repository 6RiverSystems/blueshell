import { assert } from 'chai';

import {
	renderTree,
	LatchedSelector,
	LatchedSequence,
	Action,
	rc,
	ResultCode,
	BlueshellState,
} from '../../lib';
import { RobotState, waitAi } from '../nodes/test/RobotActions';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const parse = require('dotparser');

class ConsumeOnce extends Action<any, any> {
	onEvent(state: any): ResultCode {
		const storage: any = this.getNodeStorage(state);

		if (storage.ateOne) {
			delete storage.ateOne;
			return rc.SUCCESS;
		} else {
			storage.ateOne = true;
			return rc.RUNNING;
		}
	}
}

describe('renderTree', function () {
	context('archy tree', function () {
		context('contextDepth', function () {
			const testTree = new LatchedSequence('root', [
				new LatchedSequence('0', [
					new LatchedSequence('0.0', [new ConsumeOnce('0.0.0'), new ConsumeOnce('0.0.1')]),
					new LatchedSequence('0.1', [new ConsumeOnce('0.1.0'), new ConsumeOnce('0.1.1')]),
				]),
				new LatchedSequence('1', [new ConsumeOnce('1.0'), new ConsumeOnce('1.1')]),
			]);
			let state: BlueshellState = {
				errorReason: undefined,
				__blueshell: {},
			};
			beforeEach(function () {
				state = {
					errorReason: undefined,
					__blueshell: {},
				};
			});
			function runContextDepthTest(
				expectedNodes: number,
				expectedEllipses: number,
				expectedArrows: number,
				contextDepth?: number,
			) {
				const render = renderTree!.toString(testTree, state, contextDepth);

				const nodesShown = render.split('\n').length - 1;
				const ellipsesShown = getCount(/\.\.\./g);
				const arrowsShown = getCount(/=>/g);

				assert.strictEqual(nodesShown, expectedNodes, 'nodes');
				assert.strictEqual(ellipsesShown, expectedEllipses, 'ellipses');
				assert.strictEqual(arrowsShown, expectedArrows, 'arrows');

				function getCount(re: RegExp) {
					const matches = render.match(re);
					return (matches && matches.length) || 0;
				}
			}
			context('before running', function () {
				it('should show everything at unspecified context depth', function () {
					runContextDepthTest(11, 0, 0);
				});
				it('should show nothing at -1 context depth', function () {
					runContextDepthTest(0, 0, 0, -1);
				});
				it('should show root ellipsis at 0 context depth', function () {
					runContextDepthTest(1, 1, 0, 0);
				});
			});
			context('after one run', function () {
				beforeEach(async function () {
					await testTree.handleEvent(state, {});
				});
				it('should arrow the first path at unspecified context depth', function () {
					runContextDepthTest(11, 0, 4);
				});
				it('should show only the active path at -1 context depth', function () {
					runContextDepthTest(4, 0, 4, -1);
				});
				it('should show only the active path and ellipses at 0 context depth', function () {
					runContextDepthTest(7, 3, 4, 0);
				});
				it('should show only the active path, siblings, and ellipses at 1 context depth', function () {
					runContextDepthTest(11, 4, 4, 1);
				});
				it('should show everything at 2 context depth', function () {
					runContextDepthTest(11, 0, 4, 2);
				});
			});
		});
		it('should not crash', function (done) {
			renderTree!.toConsole(waitAi);
			done();
		});

		it('should generate a tree of nodes without a state', function (done) {
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
			// console.log(a);

			done();
		});

		it('should generate a tree of nodes with state', function () {
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
			// console.log(a);
		});
	});

	context('dot notation tree', function () {
		it('should not crash', function (done) {
			renderTree!.toDotConsole(waitAi);
			done();
		});
		it('should generate a dot string without state', function (done) {
			const dotString = renderTree.toDotString(waitAi);

			assert.notOk(dotString.includes('fillcolor="#4daf4a"')); // SUCCESS
			assert.notOk(dotString.includes('fillcolor="#984ea3"')); // FAILURE
			assert.notOk(dotString.includes('fillcolor="#377eb8"')); // RUNNING
			assert.notOk(dotString.includes('fillcolor="#e41a1c"')); // ERROR
			// eslint-disable-next-line no-console
			console.log(dotString);
			assert.doesNotThrow(function () {
				parse(dotString);
			});
			done();
		});

		it('should generate a digraph string with state', function () {
			const state = new RobotState();
			const event = 'testEvent';

			state.overheated = true;

			waitAi.handleEvent(state, event);

			const result = renderTree.toDotString(waitAi, state);

			assert.ok(result);
			// eslint-disable-next-line no-console
			console.log(result);
			assert.doesNotThrow(function () {
				parse(result);
			});
		});

		it('should generate a digraph with custom node', function (done) {
			const customLSelector = new CustomLatchedSelector();
			const dotString = renderTree.toDotString(customLSelector);
			// eslint-disable-next-line no-console
			console.log(dotString);
			assert.doesNotThrow(function () {
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
