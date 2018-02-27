/**
 * Created by josh on 1/15/16.
 */
import {Sequence} from './Sequence';
import {Base} from './Base';
import {BlueshellState} from './BlueshellState';

export class LatchedSequence<S extends BlueshellState, E> extends Sequence<S, E> {

	constructor(name: string, children: Base<S, E>[]) {
		super(name, children, true);
	}
}
