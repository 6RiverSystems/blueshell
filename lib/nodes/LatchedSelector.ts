/**
 * Created by josh on 1/10/16.
 */
import {BlueshellState} from './BlueshellState';
import {Selector} from './Selector';
import {Base} from './Base';

export class LatchedSelector<S extends BlueshellState, E> extends Selector<S, E> {

	constructor(name: string, children: Base<S, E>[]) {
		super(name, children, true);
	}
}
