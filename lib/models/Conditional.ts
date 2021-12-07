/**
 * Used in several components for flow control purposes. Must be a pure function with no side-effects.
 */
export interface Conditional<S, E> {
	(state: S, event: E): boolean;
}
