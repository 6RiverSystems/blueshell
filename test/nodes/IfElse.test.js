/**
 * Created by josh on 1/10/16.
 */
'use strict';

let assert = require('chai').assert;

let Behavior = require('../../lib');

describe('IfElse', function() {

	let successAction = new class extends Behavior.Action {
		onEvent(state, event) {

			state.success = true;

			return {
				result: 'SUCCESS',
				state
			};
		}
	};

	let failureAction = new class extends Behavior.Action {
		onEvent(state, event) {

			state.success = false;

			return {
				result: 'FAILURE',
				state
			};
		}
	};

	it('should return success when conditional is true with no alternative', function() {

		let ifElse = new Behavior.IfElse('testIfElse',
			(state, event) => true,
			successAction
		);

		let p = ifElse.handleEvent({}, 'testEvent');

		return p.then(res => {
			assert.notOk(res.state.errorReason);
			assert.equal(res.result, 'SUCCESS', 'Behavior Tree success');
			assert.isTrue(res.state.success, 'Expected Action was called');
		});
	});

	it('should return success when conditional is true with an alternative', function() {

		let ifElse = new Behavior.IfElse('testIfElse',
			(state, event) => true,
			successAction,
			failureAction
		);

		let p = ifElse.handleEvent({}, 'testEvent');

		return p.then(res => {
			assert.notOk(res.state.errorReason);
			assert.equal(res.result, 'SUCCESS', 'Behavior Tree success');
			assert.isTrue(res.state.success, 'Expected Action was called');
		});
	});

	it('should return success when conditional is false', function() {

		let ifElse = new Behavior.IfElse('testIfElse',
			(state, event) => false,
			failureAction,
			successAction
		);

		let p = ifElse.handleEvent({}, 'testEvent');

		return p.then(res => {
			assert.notOk(res.state.errorReason);
			assert.equal(res.result, 'SUCCESS', 'Behavior Tree success');
			assert.isTrue(res.state.success, 'Expected Action was called');
		});
	});


	it('should return failure when conditional is false and there is no alternative', function() {

		let ifElse = new Behavior.IfElse('testIfElse',
			(state, event) => false,
			successAction
		);

		let p = ifElse.handleEvent({}, 'testEvent');

		return p.then(res => {
			assert.notOk(res.state.errorReason);
			assert.equal(res.result, 'FAILURE', 'Behavior Tree success');
			assert.isNotTrue(res.state.success, 'Expected Action was called');
		});
	});
});
