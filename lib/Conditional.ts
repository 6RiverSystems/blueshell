/**
 * Created by jpollak on 8/30/16.
 */
'use strict';

interface Conditional {
	(state: any, event: any): boolean;
}

export = Conditional;
