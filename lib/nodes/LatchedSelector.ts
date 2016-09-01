/**
 * Created by josh on 1/10/16.
 */
'use strict';

import Selector = require('./Selector');
import Base = require('./Base');

class LatchedSelector extends Selector {

	constructor(name: string, children: Array<Base>) {
		super(name, children, true);
	}

}

export = LatchedSelector;
