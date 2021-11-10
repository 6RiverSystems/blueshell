import {ResultCode} from './ResultCode';

export interface ConditionalWithResult<S, E> {
	(state: S, event: E, res: ResultCode): boolean;
}
