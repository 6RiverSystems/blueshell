/**
 * Created by josh on 1/10/16.
 */
'use strict';

import {assert} from 'chai';

import {
	Operation,
	ResultCodes,
	Sequence
} from '../../lib';

import {BasicState} from './test/Actions';

class ShootFlares extends Operation<BasicState> {

	onEvent(state: BasicState): Promise<ResultCodes> {

		let result = ResultCodes.FAILURE;

		if (state.flares > 0) {
			state.flares--;
			result = ResultCodes.SUCCESS;
		}

		return Promise.resolve(result);
	}
}

class EvasiveManeuver extends Operation<BasicState> {

	onEvent(state: BasicState): Promise<ResultCodes> {
		state.commands.push('turnLeft');

		return Promise.resolve(ResultCodes.SUCCESS);
	}
}

let droneAi = new Sequence('droneAi',
	[
		new ShootFlares(),
		new EvasiveManeuver()
	]);

describe('Sequence', function() {
	it('should return success', function() {
		// With an armed jet
		let botState: BasicState = new BasicState();
		botState.flares = 2;

		let p = droneAi.handleEvent(botState);

		return p.then(res => {
			assert.equal(res, ResultCodes.SUCCESS, 'Behavior Tree success');
			assert.equal(botState.flares, 1, 'Used Flares');
			assert.equal(botState.commands[0], 'turnLeft', 'Turning Left');
		});
	});

	it('should return failure', function() {
		// With an empty jet
		let botState: BasicState = new BasicState();
		botState.flares = 0;

		let p = droneAi.handleEvent(botState);

		return p.then(res => {
			assert.equal(res, ResultCodes.FAILURE, 'Behavior Tree failure');
			assert.equal(botState.flares, 0, 'Used Flares');
			assert.equal(botState.commands.length, 0, 'No Commands');
		});

	});
});
