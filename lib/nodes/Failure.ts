import {BlueshellState, rc} from '../models';
import {Constant} from '.';

export class Failure<S extends BlueshellState, E> extends Constant<S, E> {
	constructor(
		name = 'Failure'
	) {
		super(rc.FAILURE, name);
	}
}
