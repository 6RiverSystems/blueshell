/**
 * Created by josh on 1/10/16.
 */
'use strict';

var test = require('tape');

var Behavior = require('../index');

class ShootFlares extends Behavior.Action {

	handleEvent(state, event) {

		let result = 'FAILURE';

		if (state.flares > 0) {
			state.flares--;
			result = 'SUCCESS';
		}

		return Promise.resolve({
			result,
			state
		});
	}
}

class EvasiveManeuver extends Behavior.Action {

	handleEvent(state, event) {
		state.commands.push('turnLeft');

		return Promise.resolve({
			result: 'SUCCESS',
			state
		});
	}
}

let droneAi = new Behavior.Sequence('droneAi',
	[
		new ShootFlares(),
		new EvasiveManeuver()
	]);

test('Sequence Success Test', function(t) {

	// With an armed jet
	let jet = {
		flares: 2,
		commands: []
	};
	let p = droneAi.handleEvent(jet, 'underAttack');

	p.then(res => {
		t.equal(res.result, 'SUCCESS', 'Behavior Tree success');
		t.equal(res.state.flares, 1, 'Used Flares');
		t.equal(res.state.commands[0], 'turnLeft', 'Turning Left');

		t.end();
	});

});

test('Sequence Failure Test', function(t) {

	// With an empty jet
	var emptyJet = {
		flares: 0,
		commands: []
	};
	let p = droneAi.handleEvent(emptyJet, 'underAttack');

	p.then(res => {
		t.equal(res.result, 'FAILURE', 'Behavior Tree failure');
		t.equal(res.state.flares, 0, 'Used Flares');
		t.equal(res.state.commands.length, 0, 'No Commands');

		t.end();
	});

});
