/**
 * Created by josh on 1/10/16.
 */
import { assert } from 'chai';

import { DroneState } from './test/DroneActions';
import { rc } from '../../lib';
import * as Behavior from '../../lib';

class ShootFlares extends Behavior.Action<DroneState, string> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onEvent(state: DroneState, event: string) {
		let result = rc.FAILURE;

		if (state.flares > 0) {
			state.flares--;
			result = rc.SUCCESS;
		}

		return result;
	}
}
class EvasiveManeuver extends Behavior.Action<DroneState, string> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onEvent(state: DroneState, event: string) {
		state.commands.push('turnLeft');

		return rc.SUCCESS;
	}
}

const droneAi = new Behavior.Sequence('droneAi', [new ShootFlares(), new EvasiveManeuver()]);

describe('Sequence', function () {
	it('should return success', function () {
		// With an armed jet
		const jetState = new DroneState();
		jetState.flares = 2;

		const res = droneAi.handleEvent(jetState, 'underAttack');

		assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
		assert.equal(jetState.flares, 1, 'Used Flares');
		assert.equal(jetState.commands[0], 'turnLeft', 'Turning Left');
	});

	it('should return failure', function () {
		// With an empty jet
		const emptyDrone = new DroneState();
		emptyDrone.flares = 0;

		const res = droneAi.handleEvent(emptyDrone, 'underAttack');

		assert.equal(res, rc.FAILURE, 'Behavior Tree failure');
		assert.equal(emptyDrone.flares, 0, 'Used Flares');
		assert.equal(emptyDrone.commands.length, 0, 'No Commands');
	});
});
