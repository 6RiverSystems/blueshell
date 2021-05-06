import {BlueshellState, rc} from '../models';
import {Constant} from '.';

export class Error<S extends BlueshellState, E> extends Constant<S, E> {
	constructor(
		name = 'Error'
	) {
		super(rc.ERROR, name);
	}
}
