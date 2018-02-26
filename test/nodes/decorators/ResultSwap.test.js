'use strict';

const assert = require('chai').assert;

const rc = require('../../../lib/utils/resultCodes');
const Behavior = require('../../../lib');
const Action = Behavior.Action;
const ResultSwap = Behavior.decorators.ResultSwap;

class SuccessAction extends Action {
	constructor() {
		super('successAction');
	}

	onEvent(state, event) {
		return rc.SUCCESS;
	}
}

class FailureAction extends Action {
	constructor() {
		super('failureAction');
	}

	onEvent(state, event) {
		return rc.FAILURE;
	}
}

describe('ResultSwap', function() {
	it('success in action should return success', function() {
		const successAction = new SuccessAction();
		const resultSwap = new ResultSwap(rc.FAILURE, rc.SUCCESS, successAction);

		return resultSwap
		.handleEvent({}, {})
		.then((response) => {
			assert.equal(response, rc.SUCCESS);
		});
	});

	it('failure in action should return success', function() {
		const failureAction = new FailureAction();
		const resultSwap = new ResultSwap(rc.FAILURE, rc.SUCCESS, failureAction);

		return resultSwap
		.handleEvent({}, {})
		.then((response) => {
			assert.equal(response, rc.SUCCESS);
		});
	});

	it('should use default name', function() {
		const failureAction = new FailureAction();
		const resultSwap = new ResultSwap(rc.FAILURE, rc.SUCCESS, failureAction);

		assert.equal(resultSwap.name, 'ResultSwap_FAILURE-SUCCESS-failureAction');
	});

	it('should use overridden name', function() {
		const failureAction = new FailureAction();
		const resultSwap = new ResultSwap(rc.FAILURE, rc.SUCCESS, failureAction, 'foo');

		assert.equal(resultSwap.name, 'foo');
	});
});
