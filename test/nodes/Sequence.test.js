/**
 * Created by josh on 1/10/16.
 */
'use strict';

let assert = require('chai').assert;

let rc = require('../../lib/utils/resultCodes');
let Behavior = require('../../lib');

class ShootFlares extends Behavior.Action {

	onEvent(state, event) {

		let result = rc.FAILURE;

		if (state.flares > 0) {
			state.flares--;
			result = rc.SUCCESS;
		}

		return result;
	}
}

class EvasiveManeuver extends Behavior.Action {

	onEvent(state, event) {
		state.commands.push('turnLeft');

		return rc.SUCCESS;
	}
}

let droneAi = new Behavior.Sequence('droneAi',
	[
		new ShootFlares(),
		new EvasiveManeuver()
	]);

describe('Sequence', function() {
	it('should return success', function() {
		// With an armed jet
		let jetState = {
			flares: 2,
			commands: []
		};
		let p = droneAi.handleEvent(jetState, 'underAttack');

		return p.then(res => {
			assert.equal(res, rc.SUCCESS, 'Behavior Tree success');
			assert.equal(jetState.flares, 1, 'Used Flares');
			assert.equal(jetState.commands[0], 'turnLeft', 'Turning Left');
		});
	});

	it('should return failure', function() {
		// With an empty jet
		let emptyJet = {
			flares: 0,
			commands: []
		};
		let p = droneAi.handleEvent(emptyJet, 'underAttack');

		return p.then(res => {
			assert.equal(res, rc.FAILURE, 'Behavior Tree failure');
			assert.equal(emptyJet.flares, 0, 'Used Flares');
			assert.equal(emptyJet.commands.length, 0, 'No Commands');
		});

	});
});
