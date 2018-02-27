import {assert} from 'chai';

import {resultCodes as rc} from '../../../lib/utils/resultCodes';

import * as Behavior from '../../../lib';
import {DroneState} from '../test/DroneActions';

const Action = Behavior.Action;
const RepeatOnResult = Behavior.decorators.RepeatOnResult;

const ResultSwap = Behavior.decorators.ResultSwap;

class SuccessAction extends Action<DroneState, string> {
	constructor() {
		super('successAction');
	}

	onEvent(state: DroneState, event: string): string {
		return rc.SUCCESS;
	}
}

class FailureAction extends Action<DroneState, string> {
	constructor() {
		super('failureAction');
	}

	onEvent(state: DroneState, event: string): string {
		return rc.FAILURE;
	}
}

describe('ResultSwap', function() {
	it('success in action should return success', function() {
		const successAction = new SuccessAction();
		const resultSwap = new ResultSwap(rc.FAILURE, rc.SUCCESS, successAction);

		return resultSwap
		.handleEvent(new DroneState(), '')
		.then((response) => {
			assert.equal(response, rc.SUCCESS);
		});
	});

	it('failure in action should return success', function() {
		const failureAction = new FailureAction();
		const resultSwap = new ResultSwap(rc.FAILURE, rc.SUCCESS, failureAction);

		return resultSwap
		.handleEvent(new DroneState(), '')
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
