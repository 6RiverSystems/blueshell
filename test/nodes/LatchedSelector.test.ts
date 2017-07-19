/**
 * Created by josh on 1/10/16.
 */
'use strict';

import {assert} from 'chai';

import {
	Event,
	LatchedSelector,
	ResultCodes,
} from '../../lib';

import {BasicState} from './test/Actions';

import * as TestActions from './test/Actions';

let shutdownAi = new LatchedSelector('shutdownAi',
	[
		new TestActions.Recharge(),
		new TestActions.EmergencyShutdown()
	]);

let waitAi = TestActions.waitAi;

describe('LatchedSelector', function() {

	it('should return success', function() {

		// With a happy bot
		let botState: BasicState;
		botState.overheated = false;

		let p = shutdownAi.handleEvent(botState, new Event('channelType', 'channelId', 'lowBattery 1'));

		return p.then(res => {
			assert.equal(res, ResultCodes.SUCCESS, 'Behavior Tree success');
			assert.equal(botState.commands.length, 1, 'Only one command');
			assert.equal(botState.commands[0], 'findDock', 'Searching for dock');
		});
	});

	it('should return failure', function() {
		// With a happy bot
		let botState: BasicState;
		botState.overheated = true;
		botState.batteryLevel = 0;

		let p = waitAi.handleEvent(botState, new Event('channelType', 'channelId', 'lowBattery 1'));

		return p.then(res => {
			assert.equal(res, ResultCodes.RUNNING, 'Behavior Tree Running');
			assert.equal(botState.batteryLevel, 1, 'Ran recharge only once');

			return waitAi.handleEvent(botState, new Event('channelType', 'channelId', 'lowBattery 2'));
		}).then(res => {
			assert.equal(res, ResultCodes.SUCCESS, 'Behavior Tree Success');
			assert.equal(botState.commands.length, 0, 'No commands, waiting for cooldown');

			// Ticking the battery level only twice proves we latched
			// on cooldown and didn't run recharge.
			assert.equal(botState.batteryLevel, 1, 'Ran recharge only once');

			return waitAi.handleEvent(botState, new Event('channelType', 'channelId', 'lowBattery 3'));
		}).then(res => {
			assert.equal(res, ResultCodes.SUCCESS, 'Behavior Tree Success');
			assert.equal(botState.commands.length, 1, 'Only one command');
			assert.equal(botState.commands[0], 'findDock', 'Searching for dock');

			// Ticking the battery level only twice proves we latched
			// on cooldown and didn't run recharge.
			assert.equal(botState.batteryLevel, 2, 'Ran recharge twice');
		});
	});
});
