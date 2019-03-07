import {BlueshellState} from './BlueshellState';
import {Base} from './Base';
import {resultCodes} from '..';

export class Predicate<S extends BlueshellState, E> extends Base<S, E> {
	constructor(name: string, private readonly predicate: (state: S, event: E) => boolean) {
		super(name);
	}
	onEvent(state: S, event: E) {
		return this.predicate(state, event) ? resultCodes.SUCCESS : resultCodes.FAILURE;
	}
}
