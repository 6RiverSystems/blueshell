'use strict';

import {Sequence} from './Sequence';
import {Base} from '../Base';

export class LatchedSequence<State> extends Sequence<State> {

	constructor(name: string, children: Array<Base<State>>) {
		super(name, children, true);
	}

	get symbol(): string {
		return '⍈';
	}
}
