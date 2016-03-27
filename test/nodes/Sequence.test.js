/**
 * Created by josh on 1/10/16.
 */
'use strict';

let assert = require('chai').assert;
let Behavior = require('../../lib');

class ShootFlares extends Behavior.Action {

	onEvent(state, event) {

		let result = 'FAILURE';

		if (state.flares > 0) {
			state.flares--;
			result = 'SUCCESS';
		}

		return {
			result,
			state
		};
	}
}

class EvasiveManeuver extends Behavior.Action {

	onEvent(state, event) {
		state.commands.push('turnLeft');

		return {
			result: 'SUCCESS',
			state
		};
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
		let jet = {
			flares: 2,
			commands: []
		};
		let p = droneAi.handleEvent(jet, 'underAttack');

		return p.then(res => {
			assert.equal(res.result, 'SUCCESS', 'Behavior Tree success');
			assert.equal(res.state.flares, 1, 'Used Flares');
			assert.equal(res.state.commands[0], 'turnLeft', 'Turning Left');
		});
	});

	it('should return failure', function() {
		// With an empty jet
		var emptyJet = {
			flares: 0,
			commands: []
		};
		let p = droneAi.handleEvent(emptyJet, 'underAttack');

		return p.then(res => {
			assert.equal(res.result, 'FAILURE', 'Behavior Tree failure');
			assert.equal(res.state.flares, 0, 'Used Flares');
			assert.equal(res.state.commands.length, 0, 'No Commands');
		});

	});
});
