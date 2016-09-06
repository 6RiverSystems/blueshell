/**
 * Created by josh on 1/10/16.
 */
'use strict';

import {Selector} from './Selector';
import {Base} from './Base';

export class LatchedSelector extends Selector {

	constructor(name: string, children: Array<Base>) {
		super(name, children, true);
	}

}
