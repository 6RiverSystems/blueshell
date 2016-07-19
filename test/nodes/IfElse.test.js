/**
 * Created by josh on 1/10/16.
 */
'use strict';

let assert = require('chai').assert;

let rc = require('../../lib/utils/resultCodes');
let Behavior = require('../../lib');

describe('IfElse', function() {

	let successAction = new class extends Behavior.Action {
		onEvent(state, event) {

			state.success = true;

			return rc.SUCCESS;
		}
	};

	let failureAction = new class extends Behavior.Action {
		onEvent(state, event) {

			state.success = false;

			return rc.FAILURE;
		}
	};

	it('should return success when conditional is true with no alternative', function() {

		let ifElse = new Behavior.IfElse('testIfElse',
			(state, event) => true,
			successAction
		);

		let state = {};
		let p = ifElse.handleEvent(state, 'testEvent');

		return p.then(res => {
			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
			assert.isTrue(state.success, 'Expected Action was called');
		});
	});

	it('should return success when conditional is true with an alternative', function() {

		let ifElse = new Behavior.IfElse('testIfElse',
			(state, event) => true,
			successAction,
			failureAction
		);

		let state = {};
		let p = ifElse.handleEvent(state, 'testEvent');

		return p.then(res => {
			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
			assert.isTrue(state.success, 'Expected Action was called');
		});
	});

	it('should return success when conditional is false', function() {

		let ifElse = new Behavior.IfElse('testIfElse',
			(state, event) => false,
			failureAction,
			successAction
		);

		let state = {};
		let p = ifElse.handleEvent(state, 'testEvent');

		return p.then(res => {
			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
			assert.isTrue(state.success, 'Expected Action was called');
		});
	});


	it('should return failure when conditional is false and there is no alternative', function() {

		let ifElse = new Behavior.IfElse('testIfElse',
			(state, event) => false,
			successAction
		);

		let state = {};
		let p = ifElse.handleEvent(state, 'testEvent');

		return p.then(res => {
			assert.notOk(state.errorReason);
			assert.equal(res, rc.FAILURE, 'Behavior Tree success');
			assert.isNotTrue(state.success, 'Expected Action was called');
		});
	});
});
