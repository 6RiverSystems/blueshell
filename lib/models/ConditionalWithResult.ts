import { ResultCode } from './ResultCode';

/**
 * Used in several components for flow control purposes. Must be a pure function with no side-effects.
 */
export interface ConditionalWithResult<S, E> {
	(state: S, event: E, res: ResultCode): boolean;
}
