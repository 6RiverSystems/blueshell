/**
 * Created by josh on 1/10/16.
 */
'use strict';

const assert = require('chai').assert;

const rc = require('../../lib/utils/resultCodes');
const Behavior = require('../../lib');

describe('IfElse', function() {
	const successAction = new class extends Behavior.Action {
		onEvent(state, event) {
			state.success = true;

			return rc.SUCCESS;
		}
	};

	const failureAction = new class extends Behavior.Action {
		onEvent(state, event) {
			state.success = false;

			return rc.FAILURE;
		}
	};

	it('should return success when conditional is true with no alternative', function() {
		const ifElse = new Behavior.IfElse('testIfElse',
			(state, event) => true,
			successAction
		);

		const state = {};
		const p = ifElse.handleEvent(state, 'testEvent');

		return p.then((res) => {
			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
			assert.isTrue(state.success, 'Expected Action was called');
		});
	});

	it('should return success when conditional is true with an alternative', function() {
		const ifElse = new Behavior.IfElse('testIfElse',
			(state, event) => true,
			successAction,
			failureAction
		);

		const state = {};
		const p = ifElse.handleEvent(state, 'testEvent');

		return p.then((res) => {
			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
			assert.isTrue(state.success, 'Expected Action was called');
		});
	});

	it('should return success when conditional is false', function() {
		const ifElse = new Behavior.IfElse('testIfElse',
			(state, event) => false,
			failureAction,
			successAction
		);

		const state = {};
		const p = ifElse.handleEvent(state, 'testEvent');

		return p.then((res) => {
			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
			assert.isTrue(state.success, 'Expected Action was called');
		});
	});


	it('should return failure when conditional is false and there is no alternative', function() {
		const ifElse = new Behavior.IfElse('testIfElse',
			(state, event) => false,
			successAction
		);

		const state = {};
		const p = ifElse.handleEvent(state, 'testEvent');

		return p.then((res) => {
			assert.notOk(state.errorReason);
			assert.equal(res, rc.FAILURE, 'Behavior Tree success');
			assert.isNotTrue(state.success, 'Expected Action was called');
		});
	});
});
