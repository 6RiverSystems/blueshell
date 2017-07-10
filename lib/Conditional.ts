/**
 * Created by jpollak on 8/30/16.
 */
'use strict';

export interface Conditional {
	(state: any): boolean;
}
