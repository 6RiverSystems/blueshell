import { Sequence } from './Sequence';
import { BlueshellState, BaseNode } from '../models';

/**
 * Sends an event to each child until one of the returns `FAILURE`, or `RUNNING`, then returns that value.
 * If all children return `SUCCESS`, return `SUCCESS`.
 * If a child returns `RUNNING`, subsequent events start at that child.
 * 1/15/16
 * @author Joshua Chaitin-Pollak
 */
export class LatchedSequence<S extends BlueshellState, E> extends Sequence<S, E> {
	constructor(name: string, children: BaseNode<S, E>[]) {
		super(name, children, true);
	}

	get symbol(): string {
		return '⍈';
	}
}
