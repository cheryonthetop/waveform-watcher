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

const initialState = {
  user: "",
  runID: "",
  eventID: "",
  waveform: undefined,
  tagsData: [],
  availableRuns: [],
  isLoading: true,
};

export default function (state = initialState, action) {
  console.log(
    "received action of type " +
      action.type +
      " and data " +
      JSON.stringify(action.payload)
  );
  switch (action.type) {
    case LOAD_SUCCESS: {
      let availableRuns = [];
      console.log(action.payload.available_runs);
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
        runID: action.payload.run_id,
        eventID: action.payload.event_id,
        waveform: action.payload.waveform,
      };
    case GET_EVENT_PLOT_SUCCESS:
      return {
        ...state,
        runID: action.payload.run_id,
        eventID: action.payload.event_id,
        eventPlot: action.payload.eventPlot,
      };
    case LOAD_FAILURE:
    case DELETE_WAVEFORM_FAILURE:
    case GET_EVENT_PLOT_FAILURE:
    case SAVE_WAVEFORM_FAILURE:
    case GET_WAVEFORM_FAILURE:
    default:
      return state;
  }
}
