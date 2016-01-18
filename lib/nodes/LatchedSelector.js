/**
 * Created by josh on 1/10/16.
 */
'use strict';

var Selector = require('./Selector');

class LatchedSelector extends Selector {

	constructor(name, children) {
		super(name, children, true);
	}

}

module.exports = LatchedSelector;
