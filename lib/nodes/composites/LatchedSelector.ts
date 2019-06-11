'use strict';

import {Selector} from './Selector';
import {Base} from '../Base';

export class LatchedSelector<State> extends Selector<State> {

	constructor(name: string, children: Array<Base<State>>) {
		super(name, children, true);
	}

	get symbol(): string {
		return '⎅';
	}
}
