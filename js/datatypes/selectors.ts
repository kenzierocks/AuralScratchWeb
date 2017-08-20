import {createSelectorCreator, defaultMemoize} from "reselect";
import {valuesEqual} from "../objectEquality";
export const createDeepEqualsSelector = createSelectorCreator(
    defaultMemoize,
    valuesEqual
);
