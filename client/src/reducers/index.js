import { combineReducers } from "redux";
import userReducers from "./userReducers";
import waveformReducers from "./waveformReducers";
import errorReducers from "./errorReducers";

export default combineReducers({
  auth: userReducers,
  waveform: waveformReducers,
  error: errorReducers,
});
