import { assert } from 'chai';

import { Constant, rc } from '../../../lib';
import * as Behavior from '../../../lib';
import { DroneState } from '../test/DroneActions';

const ResultAdapt = Behavior.decorators.ResultAdapt;

describe('ResultAdapt', function () {
	it('should apply the resultAdapter', function () {
		const testState = new DroneState();
		const testEvent = {};

		const resultAdapt = new ResultAdapt(
			'adaptResultToFailure',
			new Constant(rc.SUCCESS),
			(state: DroneState, event: unknown, res: Behavior.ResultCode) => {
				assert.equal(state, testState);
				assert.equal(event, testEvent);
				assert.equal(res, rc.SUCCESS);
				return rc.FAILURE;
			},
		);

		const response = resultAdapt.handleEvent(testState, testEvent);

		assert.equal(response, rc.FAILURE);
	});
});
