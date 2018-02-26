/**
 * Created by josh on 1/15/16.
 */
import {BlueshellState} from './BlueshellState';
import {Sequence} from './Sequence';
import {Base} from './Base';

export class LatchedSequence<S extends BlueshellState, E> extends Sequence<S, E> {
	constructor(name: string, children: Base<S, E>[]) {
		super(name, children, true);
	}
}
