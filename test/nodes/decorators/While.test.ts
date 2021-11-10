import {assert} from 'chai';
import {rc} from '../../../lib';
import * as Behavior from '../../../lib';
import {DroneState} from '../test/DroneActions';

const Action = Behavior.Action;
const While = Behavior.decorators.While;

class CountUntil extends Action<DroneState, number> {
	public eventCount: number = 0;

	onEvent(state: DroneState, event: number): Behavior.ResultCode {
		this.eventCount++;
		state.flares++;
		return rc.SUCCESS;
	}
}

describe('While', function() {
	it('returns defaultResult when the condition is alreay met', function() {
		const countUntil = new CountUntil();

		const uut = new While(
			'test',
			countUntil,
			(state: DroneState, event: number) => {
				return state.flares < 1;
			},
			rc.FAILURE,
		);

		const state = new DroneState();
		state.flares = 1;

		const result = uut.handleEvent(state, 0);

		assert.strictEqual(rc.FAILURE, result);
		assert.strictEqual(state.flares, 1);
		assert.strictEqual(countUntil.eventCount, 0);
	});

	it('executes the child action until condition is met and returns the final result', function() {
		const countUntil = new CountUntil();

		const uut = new While(
			'test',
			countUntil,
			(state: DroneState, event: number) => {
				return state.flares < 1;
			},
		);

		const state = new DroneState();

		const result = uut.handleEvent(state, 0);

		assert.strictEqual(rc.SUCCESS, result);
		assert.strictEqual(state.flares, 1);
		assert.strictEqual(countUntil.eventCount, 1);
	});
});
