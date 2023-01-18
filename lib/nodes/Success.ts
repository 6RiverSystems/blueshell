import { Constant } from './Constant';
import { BlueshellState, rc } from '../models';

export class Success<S extends BlueshellState, E> extends Constant<S, E> {
	constructor(name = 'Success') {
		super(rc.SUCCESS, name);
	}
}
