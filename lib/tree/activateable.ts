import {BlueshellState} from '../nodes/BlueshellState';
import {Base as Action} from '../nodes/Base';
import {ResultCode, resultCodes} from '../utils/resultCodes';

function activationCheck<E>(storage: any) {
	return storage.lastResult !== resultCodes.RUNNING;
}

function reactivationCheck<E>(storage: any, e: E) {
	return (<any>e).type === 'reactivate' || storage.lastResult !== resultCodes.RUNNING;
}

class Activatable<S extends BlueshellState, E> extends Action<S, E> {
	constructor(
		name: string,
		private readonly onActivateFn: RunningFn<S, E>,
		private readonly onRunningFn: RunningFn<S, E>,
		private readonly activationCheck: (storage: any, e: E) => boolean,
	) {
		super(name);
	}

	onEvent(state: S, event: E): ResultCode {
		const storage = this.getNodeStorage(state);

		if (storage.lastResult !== resultCodes.ERROR) {
			if (this.activationCheck) {
				return this.onActivateFn(state, event);
			} else {
				return this.onRunningFn(state, event);
			}
		} else {
			return resultCodes.ERROR;
		}
	}
}

export type ActivateFn<S extends BlueshellState, E> = (state: S, event: E) => ResultCode
export type RunningFn<S extends BlueshellState, E> = (state: S, event: E) => ResultCode

export function activatable<S extends BlueshellState, E>(
	name: string,
	onActivateFn: ActivateFn<S, E>,
	onRunningFn: RunningFn<S, E>,
): Action<S, E> {
	return new Activatable<S, E>(
		name,
		onActivateFn,
		onRunningFn,
		activationCheck);
}

export function reactivatable<S extends BlueshellState, E>(
	name: string,
	onActivateFn: ActivateFn<S, E>,
	onRunningFn: RunningFn<S, E>,
): Action<S, E> {
	return new Activatable(
		name,
		onActivateFn,
		onRunningFn,
		reactivationCheck);
}