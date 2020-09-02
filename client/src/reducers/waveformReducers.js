import {
  LOAD_SUCCESS,
  GET_WAVEFORM_SUCCESS,
  LOAD_FAILURE,
  GET_EVENT_PLOT_FAILURE,
  SAVE_WAVEFORM_FAILURE,
  GET_WAVEFORM_FAILURE,
  GET_EVENT_PLOT_SUCCESS,
  DELETE_WAVEFORM_FAILURE,
  GETTING_WAVEFORM,
  SAVE_WAVEFORM_SUCCESS,
  DELETE_WAVEFORM_SUCCESS,
  CHANGE_EVENT_ID,
  CHANGE_EVENT_INPUT_RUN,
  CHANGE_WAVEFORM_INPUT_RUN,
} from "../actions/types";

/**
 * The redux initial state for user reducer
 * @property {String} - The run ID
 * @property {Number} - The event ID
 * @property {String} - The input run ID on the waveform page
 * @property {Number} - The input event ID
 * @property {String} - The input run ID on the event page
 * @property {Object} - The waveform
 * @property {String} - A script tag string that embeds event plots
 * @property {Array<Object>} - The array of object {tag: comments, runID, waveform}
 * @property {Array<String>} - The array of runs
 * @property {Array<String>} - The array of user history
 * @property {Boolean} - If the app data is loading
 * @type {Object}
 */
const initialState = {
  runID: "",
  eventID: 0,
  inputRunIDWaveformPage: "",
  inputEventID: 0,
  inputRunIDEventPage: "",
  waveform: undefined,
  eventPlot: undefined,
  tagsData: [],
  availableRuns: [],
  waveformHistory: [],
  isLoading: true,
  strax: "",
  straxen: "",
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
        ...state,
        user: action.payload.user,
        runID: action.payload.run_id,
        eventID: action.payload.event_id,
        waveform: action.payload.waveform,
        waveformHistory: action.payload.waveform_history,
        tagsData: action.payload.tags_data,
        strax: action.payload.strax,
        straxen: action.payload.straxen,
        availableRuns: availableRuns,
        isLoading: false,
      };
    }
    case GET_WAVEFORM_SUCCESS: {
      const { runID, eventID, waveform } = action.payload;
      const record = { run_id: runID, event_id: eventID };
      const newHistory = [];
      newHistory.push(record);
      state.waveformHistory.map((waveform) => newHistory.push(waveform));
      return {
        ...state,
        waveform: waveform,
        waveformHistory: newHistory,
      };
    }
    case GETTING_WAVEFORM:
      return {
        ...state,
        runID: action.payload.runID,
        eventID: action.payload.eventID,
        waveform: undefined,
      };
    case GET_WAVEFORM_FAILURE:
      return {
        ...state,
        waveform: null,
      };
    case GET_EVENT_PLOT_SUCCESS:
      return {
        ...state,
        eventPlot: action.payload.eventPlot,
      };
    case SAVE_WAVEFORM_SUCCESS: {
      const { tag, runID, eventID, comments } = action.payload;
      const newData = {
        [tag]: { run_id: runID, event_id: eventID, comments: comments },
      };
      var newTag = state.tagsData;
      newTag.push(newData);
      return {
        ...state,
        tagsData: newTag,
      };
    }
    case DELETE_WAVEFORM_SUCCESS: {
      const { tag } = action.payload;
      const newTag = state.tagsData.filter(
        (tagData) => Object.keys(tagData)[0] !== tag
      );
      console.log(newTag);
      return {
        ...state,
        tagsData: newTag,
      };
    }
    case CHANGE_EVENT_ID: {
      return {
        ...state,
        inputEventID: action.payload.eventID,
      };
    }
    case CHANGE_EVENT_INPUT_RUN: {
      return {
        ...state,
        inputRunIDEventPage: action.payload.runID,
      };
    }
    case CHANGE_WAVEFORM_INPUT_RUN: {
      return {
        ...state,
        inputRunIDWaveformPage: action.payload.runID,
      };
    }
    case LOAD_FAILURE:
    case DELETE_WAVEFORM_FAILURE:
    case GET_EVENT_PLOT_FAILURE:
    case SAVE_WAVEFORM_FAILURE:
    default:
      return state;
  }
}
