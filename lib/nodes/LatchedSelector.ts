/**
 * Created by josh on 1/10/16.
 */
import {Base} from './Base';
import {Selector} from './Selector';
import {BlueshellState} from './BlueshellState';

/**
 * Sends an event to each child until one of them returns `SUCCESS` or `RUNNING`, then returns that value.
 * If we exhaust all the children, return `FAILURE`.
 * If a child returns `RUNNING`, subsequent events start at that child.
 * 1/10/16
 * @author Joshua Chaitin-Pollak
 */
export class LatchedSelector<S extends BlueshellState, E> extends Selector<S, E> {

	constructor(name: string, children: Base<S, E>[]) {
		super(name, children, true);
	}

	get symbol(): string {
		return '⎅';
	}
}
