'use strict';

let assert = require('chai').assert;

let rc = require('../../../lib/utils/resultCodes');
let Behavior = require('../../../lib');
let Action = Behavior.Action;
let ResultSwap = Behavior.decorators.ResultSwap;

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

		let successAction = new SuccessAction();
		let resultSwap = new ResultSwap(rc.FAILURE, rc.SUCCESS, successAction);

		return resultSwap
		.handleEvent({}, {})
		.then((response) => {
			assert.equal(response, rc.SUCCESS);
		});

	});

	it('failure in action should return success', function() {

		let failureAction = new FailureAction();
		let resultSwap = new ResultSwap(rc.FAILURE, rc.SUCCESS, failureAction);

		return resultSwap
		.handleEvent({}, {})
		.then((response) => {
			assert.equal(response, rc.SUCCESS);
		});

	});

	it('failure in action should return success', function() {

		let failureAction = new FailureAction();
		let resultSwap = new ResultSwap(rc.FAILURE, rc.SUCCESS, failureAction);

		assert.equal(resultSwap.name, 'ResultSwap_FAILURE-SUCCESS-failureAction');

	});
});
