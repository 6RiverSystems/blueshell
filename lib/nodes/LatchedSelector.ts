/**
 * Created by josh on 1/10/16.
 */
import {Base} from './Base';
import {Selector} from './Selector';
import {BlueshellState} from './BlueshellState';

export class LatchedSelector<S extends BlueshellState, E> extends Selector<S, E> {

	constructor(name: string, children: Base<S, E>[]) {
		super(name, children, true);
	}
}
