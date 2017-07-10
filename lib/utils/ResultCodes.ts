/**
 * Created by jpollak on 5/30/16.
 */
'use strict';

// TODO: Make const (requires API change - can't be returned directly)
// See https://tusksoft.com/blog/posts/11/const-enums-in-typescript-1-4-and-how-they-differ-from-standard-enums
export enum EventCode {
	CONTINUE,
	HANDLED,
	ERROR
}

export enum BehaviorCode {
	SUCCESS,
	FAILURE,
	RUNNING,
	ERROR
}
