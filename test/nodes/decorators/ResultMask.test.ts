import {assert} from 'chai';

import {rc} from '../../../lib';
import * as Behavior from '../../../lib';
import {DroneState} from '../test/DroneActions';

const Action = Behavior.Action;
const ResultMask = Behavior.decorators.ResultMask;

class SuccessAction extends Action<DroneState, string> {
	constructor() {
		super('successAction');
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onEvent(state: DroneState, event: string): Behavior.ResultCode {
		return rc.SUCCESS;
	}
}

class FailureAction extends Action<DroneState, string> {
	constructor() {
		super('failureAction');
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onEvent(state: DroneState, event: string): Behavior.ResultCode {
		return rc.FAILURE;
	}
}

describe('ResultMask', function() {
	it('success in action should return success', function() {
		const successAction = new SuccessAction();
		const resultMask = new ResultMask(rc.FAILURE, rc.SUCCESS, successAction);

		const response = resultMask.handleEvent(new DroneState(), '');

		assert.equal(response, rc.SUCCESS);
	});

	it('failure in action should return success', function() {
		const failureAction = new FailureAction();
		const resultMask = new ResultMask(rc.FAILURE, rc.SUCCESS, failureAction);

		const response = resultMask.handleEvent(new DroneState(), '');

		assert.equal(response, rc.SUCCESS);
	});

	it('should use default name', function() {
		const failureAction = new FailureAction();
		const resultMask = new ResultMask(rc.FAILURE, rc.SUCCESS, failureAction);

		assert.equal(resultMask.name, 'ResultMask_FAILURE-SUCCESS-failureAction');
	});

	it('should use overridden name', function() {
		const failureAction = new FailureAction();
		const resultMask = new ResultMask(rc.FAILURE, rc.SUCCESS, failureAction, 'foo');

		assert.equal(resultMask.name, 'foo');
	});
});
