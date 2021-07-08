export interface DecoratorFn {
	<S, E>(state: S, event: E): void;
}
