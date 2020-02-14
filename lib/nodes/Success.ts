import {BlueshellState, rc} from '../models';
import {Constant} from '.';

export class Success<S extends BlueshellState, E> extends Constant<S, E> {
	constructor(
		name = 'Success'
	) {
		super(rc.SUCCESS, name);
	}
}
