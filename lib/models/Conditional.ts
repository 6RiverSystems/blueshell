export interface Conditional<S, E> {
	(state: S, event: E): boolean;
}
