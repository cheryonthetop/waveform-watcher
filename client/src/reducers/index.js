import { combineReducers } from "redux";
import userReducers from "./userReducers";
import waveformReducers from "./waveformReducers";
import errorReducers from "./errorReducers";

/**
 * Combines the reducers to a central state
 * @type {Function} A reducer function that invokes every
 * reducer inside the passed object, and builds a state
 * object with the same shape.
 */
export default combineReducers({
  auth: userReducers,
  waveform: waveformReducers,
  error: errorReducers,
});
