import {Store} from "redux";

export function observeStoreSlice<S, SL extends keyof S>(store: Store<S>, slice: SL, onChange: (state: S[SL]) => void) {
    let currentState: S[SL];

    function handleChange() {
        const nextState = store.getState()[slice];
        if (nextState !== currentState) {
            currentState = nextState;
            onChange(currentState);
        }
    }

    let unsubscribe = store.subscribe(handleChange);
    handleChange();
    return unsubscribe;
}
