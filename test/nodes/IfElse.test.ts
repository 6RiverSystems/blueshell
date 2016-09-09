/**
 * Created by josh on 1/10/16.
 */
'use strict';

import {assert} from 'chai';
import * as Blueshell from '../../dist';

let rc = Blueshell.ResultCodes;

describe('IfElse', function() {

	let successAction = new class extends Blueshell.Operation {
		onEvent(state: any, event: any): Promise<Blueshell.ResultCodes> {

			state.success = true;

			return Promise.resolve(rc.SUCCESS);
		}
	};

	let failureAction = new class extends Blueshell.Operation {
		onEvent(state: any, event: any): Promise<Blueshell.ResultCodes> {

			state.success = false;

			return Promise.resolve(rc.FAILURE);
		}
	};

	it('should return success when conditional is true with no alternative', function() {

		let ifElse = new Blueshell.IfElse('testIfElse',
			(state, event) => true,
			successAction
		);

		let state = {
			errorReason: undefined,
			success: false
		};

		let p = ifElse.handleEvent(state, 'testEvent');

		return p.then(res => {
			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
			assert.isTrue(state.success, 'Expected Action was called');
		});
	});

	it('should return success when conditional is true with an alternative', function() {

		let ifElse = new Blueshell.IfElse('testIfElse',
			(state, event) => true,
			successAction,
			failureAction
		);

		let state = {
			errorReason: undefined,
			success: false
		};

		let p = ifElse.handleEvent(state, 'testEvent');

		return p.then(res => {
			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
			assert.isTrue(state.success, 'Expected Action was called');
		});
	});

	it('should return success when conditional is false', function() {

		let ifElse = new Blueshell.IfElse('testIfElse',
			(state, event) => false,
			failureAction,
			successAction
		);

		let state = {
			errorReason: undefined,
			success: false
		};

		let p = ifElse.handleEvent(state, 'testEvent');

		return p.then(res => {
			assert.notOk(state.errorReason);
			assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
			assert.isTrue(state.success, 'Expected Action was called');
		});
	});


	it('should return failure when conditional is false and there is no alternative', function() {

		let ifElse = new Blueshell.IfElse('testIfElse',
			(state, event) => false,
			successAction
		);

		let state = {
			errorReason: undefined,
			success: false
		};

		let p = ifElse.handleEvent(state, 'testEvent');

		return p.then(res => {
			assert.notOk(state.errorReason);
			assert.equal(res, rc.FAILURE, 'Behavior Tree success');
			assert.isNotTrue(state.success, 'Expected Action was called');
		});
	});
});
