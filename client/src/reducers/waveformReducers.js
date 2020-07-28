import {
  LOAD_SUCCESS,
  GET_WAVEFORM_SUCCESS,
  SWITCH_WAVEFORM,
  LOAD_FAILURE,
  GET_EVENT_PLOT_FAILURE,
  SAVE_WAVEFORM_FAILURE,
  GET_WAVEFORM_FAILURE,
  GET_EVENT_PLOT_SUCCESS,
  DELETE_WAVEFORM_FAILURE,
} from "../actions/types";

/**
 * The redux initial state for user reducer
 * @property {String} - The run ID
 * @property {Number} - The event ID
 * @property {Object} - The waveform
 * @property {String} - A script tag string that embeds event plots
 * @property {Array<Object>} - The array of object {tag: comments, runID, waveform}
 * @property {Array<String>} - The array of runs
 * @property {Boolean} - If the app data is loading
 * @type {Object}
 */
const initialState = {
  runID: "",
  eventID: "",
  waveform: undefined,
  eventPlot: undefined,
  tagsData: [],
  availableRuns: [],
  isLoading: true,
};

/**
 * Evaluates the action type and changes the state accordingly
 * @param {Object} state Defaults to initialState
 * @param {Object} action Usually has properties type and payload
 * @type {Function}
 */
export default function (state = initialState, action) {
  action.payload
    ? console.log(
        "received action of type " +
          action.type +
          " and data " +
          JSON.stringify(action.payload).toString().slice(0, 100)
      )
    : console.log("received action of type " + action.type);
  switch (action.type) {
    case LOAD_SUCCESS: {
      let availableRuns = [];
      Object.entries(action.payload.available_runs).map(([index, run]) =>
        availableRuns.push(run)
      );
      return {
        user: action.payload.user,
        runID: action.payload.run_id,
        eventID: action.payload.event_id,
        waveform: action.payload.waveform,
        tagsData: action.payload.tags_data,
        availableRuns: availableRuns,
        isLoading: false,
      };
    }

    case SWITCH_WAVEFORM:
    case GET_WAVEFORM_SUCCESS:
      return {
        ...state,
        runID: action.payload.runID,
        eventID: action.payload.eventID,
        waveform: action.payload.waveform,
      };
    case GET_EVENT_PLOT_SUCCESS:
      return {
        ...state,
        eventPlot: action.payload.eventPlot,
      };
    case GET_WAVEFORM_FAILURE:
      return {
        ...state,
        runID: action.payload.runID,
        eventID: action.payload.eventID,
        waveform: null,
      };
    case LOAD_FAILURE:
    case DELETE_WAVEFORM_FAILURE:
    case GET_EVENT_PLOT_FAILURE:
    case SAVE_WAVEFORM_FAILURE:
    default:
      return state;
  }
}
