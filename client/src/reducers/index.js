import { combineReducers } from "redux";
import userReducers from "./userReducers";
import waveformReducers from "./waveformReducers";

export default combineReducers({
  auth: userReducers,
  waveform: waveformReducers,
});
