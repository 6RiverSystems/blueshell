/**
 * Created by josh on 1/10/16.
 */
'use strict';

import {assert} from 'chai';

import {
	ResultCodes,
	Operation,
	IfElse
} from '../../lib';

import {BasicState} from './test/Actions';

describe('IfElse', function() {

	let successAction = new class extends Operation<BasicState> {
		onEvent(state: BasicState): Promise<ResultCodes> {

			state.success = true;

			return Promise.resolve(ResultCodes.SUCCESS);
		}
	};

	let failureAction = new class extends Operation<BasicState> {
		onEvent(state: BasicState): Promise<ResultCodes> {

			state.success = false;

			return Promise.resolve(ResultCodes.FAILURE);
		}
	};

	it('should return success when conditional is true with no alternative', function() {

		let ifElse = new IfElse('testIfElse',
			(state) => true,
			successAction
		);

		let state: BasicState = new BasicState();
		state.errorReason = undefined;

		let p = ifElse.handleEvent(state);

		return p.then(res => {
			assert.notOk(state.errorReason);
			assert.equal(res, ResultCodes.SUCCESS, 'Behavior Tree success');
			assert.isTrue(state.success, 'Expected Action was called');
		});
	});

	it('should return success when conditional is true with an alternative', function() {

		let ifElse = new IfElse('testIfElse',
			(state) => true,
			successAction,
			failureAction
		);

		let state: BasicState = new BasicState();
		state.errorReason = undefined;

		let p = ifElse.handleEvent(state);

		return p.then(res => {
			assert.notOk(state.errorReason);
			assert.equal(res, ResultCodes.SUCCESS, 'Behavior Tree success');
			assert.isTrue(state.success, 'Expected Action was called');
		});
	});

	it('should return success when conditional is false', function() {

		let ifElse = new IfElse('testIfElse',
			(state) => false,
			failureAction,
			successAction
		);

		let state: BasicState = new BasicState();
		state.errorReason = undefined;

		let p = ifElse.handleEvent(state);

		return p.then(res => {
			assert.notOk(state.errorReason);
			assert.equal(res, ResultCodes.SUCCESS, 'Behavior Tree success');
			assert.isTrue(state.success, 'Expected Action was called');
		});
	});

	it('should return failure when conditional is false and there is no alternative', function() {

		let ifElse = new IfElse('testIfElse',
			(state) => false,
			successAction
		);

		let state: BasicState = new BasicState();
		state.errorReason = undefined;

		let p = ifElse.handleEvent(state);

		return p.then(res => {
			assert.notOk(state.errorReason);
			assert.equal(res, ResultCodes.FAILURE, 'Behavior Tree success');
			assert.isNotTrue(state.success, 'Expected Action was called');
		});
	});
});
