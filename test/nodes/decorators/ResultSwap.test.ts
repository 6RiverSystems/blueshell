import {assert} from 'chai';

import {resultCodes as rc, ResultCode} from '../../../lib/utils/resultCodes';

import * as Behavior from '../../../lib';
import {DroneState} from '../test/DroneActions';

const Action = Behavior.Action;
const ResultSwap = Behavior.decorators.ResultSwap;

class SuccessAction extends Action<DroneState, string> {
	constructor() {
		super('successAction');
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onEvent(state: DroneState, event: string): ResultCode {
		return rc.SUCCESS;
	}
}

class FailureAction extends Action<DroneState, string> {
	constructor() {
		super('failureAction');
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onEvent(state: DroneState, event: string): ResultCode {
		return rc.FAILURE;
	}
}

describe('ResultSwap', function() {
	it('success in action should return success', function() {
		const successAction = new SuccessAction();
		const resultSwap = new ResultSwap(rc.FAILURE, rc.SUCCESS, successAction);

		const response = resultSwap.handleEvent(new DroneState(), '');

		assert.equal(response, rc.SUCCESS);
	});

	it('failure in action should return success', function() {
		const failureAction = new FailureAction();
		const resultSwap = new ResultSwap(rc.FAILURE, rc.SUCCESS, failureAction);

		const response = resultSwap.handleEvent(new DroneState(), '');

		assert.equal(response, rc.SUCCESS);
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
