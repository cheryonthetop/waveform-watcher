import { GET_WAVEFORM, LOAD_SUCCESS } from "../actions/types";

const initialState = {
  user: "",
  run_id: null,
  build_low_level: null,
  bokeh_model: null,
  tags_data: {},
};

export default function (state = initialState, action) {
  console.log(
    "received action of type " +
      action.type +
      " and data " +
      JSON.stringify(action.payload)
  );
  switch (action.type) {
    case LOAD_SUCCESS:
      return {
        user: action.payload.user,
        run_id: action.payload.run_id,
        build_low_level: action.payload.build_low_level,
        bokeh_model: action.payload.bokeh_model,
        tags_data: action.payload.tags_data,
      };
    case GET_WAVEFORM:
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
