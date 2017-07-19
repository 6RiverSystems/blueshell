/**
 * Created by josh on 1/18/16.
 */
'use strict';

import {assert} from 'chai';

import {
	Event,
	ResultCodes,
	Selector,
} from '../../lib';

import * as TestActions from './test/Actions';

import {BasicState} from './test/Actions';

let waitAi = new Selector('shutdownWithWaitAi',
	[
		new TestActions.Recharge(),
		new TestActions.WaitForCooldown(),
		new TestActions.EmergencyShutdown()
	]);

describe('Selector', function() {
	it('should return success', function() {

		// With a happy bot
		let botState: BasicState;
		botState.overheated = false;

		let p = waitAi.handleEvent(botState, new Event('channelType', 'channelId', 'lowBattery'));

		return p.then(res => {
			assert.equal(res, ResultCodes.SUCCESS, 'Behavior Tree success');
			assert.equal(botState.commands.length, 1, 'Only one command');
			assert.equal(botState.commands[0], 'findDock', 'Searching for dock');
		});
	});

	it('should return failure', function() {
		// With a overheated bot
		let botState: BasicState;
		botState.overheated = true;
		botState.batteryLevel = 0;

		let p = waitAi.handleEvent(botState, new Event('channelType', 'channelId', 'lowBattery 1'));

		return p.then(res => {
			assert.equal(res, ResultCodes.RUNNING, 'Behavior Tree Running');
			assert.equal(botState.batteryLevel, 1, 'Ran recharge once');

			return waitAi.handleEvent(botState, new Event('channelType', 'channelId', 'lowBattery 2'));
		}).then(res => {

			assert.equal(res, ResultCodes.SUCCESS, 'Behavior Tree Success');
			assert.equal(botState.commands.length, 0, 'No commands, waiting for cooldown');
			assert.equal(botState.batteryLevel, 2, 'Ran recharge again');

			return waitAi.handleEvent(botState, new Event('channelType', 'channelId', 'lowBattery 3'));
		}).then(res => {
			assert.equal(res, ResultCodes.SUCCESS, 'Behavior Tree Success');
			assert.equal(botState.commands.length, 1, 'Only one command');
			assert.equal(botState.commands[0], 'findDock', 'Searching for dock');

			// Ticking battery level on each call proves we are NOT latching
			assert.equal(botState.batteryLevel, 3, 'Ran recharge again');
		});
	});
});
