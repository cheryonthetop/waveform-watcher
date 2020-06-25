import {
  LOAD_SUCCESS,
  GET_WAVEFORM_SUCCESS,
  SWITCH_WAVEFORM,
} from "../actions/types";

const initialState = {
  user: "",
  run_id: "",
  build_low_level: null,
  bokeh_model: undefined,
  tags_data: [],
  available_runs: [],
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
      let available_runs = [];
      console.log(action.payload.available_runs);
      Object.entries(action.payload.available_runs).map(([index, run]) =>
        available_runs.push(run)
      );
      return {
        user: action.payload.user,
        run_id: action.payload.run_id,
        build_low_level: action.payload.build_low_level,
        bokeh_model: action.payload.bokeh_model,
        tags_data: action.payload.tags_data,
        available_runs: available_runs,
      };
    }

    case SWITCH_WAVEFORM:
    case GET_WAVEFORM_SUCCESS:
      return {
        ...state,
        run_id: action.payload.run_id,
        build_low_level: action.payload.build_low_level,
        bokeh_model: action.payload.bokeh_model,
      };
    default:
      return state;
  }
}
