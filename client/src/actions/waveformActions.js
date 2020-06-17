import {
  GET_WAVEFORM_SUCCESS,
  GET_WAVEFORM_FAILURE,
  SAVE_WAVEFORM_SUCCESS,
  SAVE_WAVEFORM_FAILURE,
  LOAD_SUCCESS,
  LOAD_FAILURE,
} from "./types";
import axios from "axios";

export const getWaveform = (user, run_id, build_low_level) => (dispatch) => {
  console.log(run_id);
  // Headers
  const config = {
    headers: {
      "Content-Type": "application/json",
      withCredentials: true,
    },
  };

  // Request body
  const body = JSON.stringify({
    user: user,
    run_id: run_id,
    build_low_level: build_low_level,
  });

  axios
    .post("http://localhost:4000/api/gw", body, config)
    .then(function (response) {
      console.log(response.data);
      dispatch({
        type: GET_WAVEFORM_SUCCESS,
        payload: {
          run_id: run_id,
          build_low_level: build_low_level,
          bokeh_model: response.data,
        },
      });
      return response.data;
    })
    .catch((err) => {
      console.log(err);
      dispatch({
        type: GET_WAVEFORM_FAILURE,
      });
    });
};

export const saveWaveform = (
  run_id,
  build_low_level,
  bokeh_model,
  tag,
  comments
) => (dispatch) => {
  console.log("save waveform action called");
  // Headers
  const config = {
    headers: {
      "Content-Type": "application/json",
      withCredentials: true,
    },
  };

  // Request body
  const body = JSON.stringify({
    run_id: run_id,
    build_low_level: build_low_level,
    bokeh_model: bokeh_model,
    tag: tag,
    comments: comments,
  });

  axios
    .post("http://localhost:4000/api/gw", body, config)
    .then(function (response) {
      console.log(response.data);
      dispatch({
        type: GET_WAVEFORM_SUCCESS,
        payload: {
          run_id: run_id,
          build_low_level: build_low_level,
          bokeh_model: response.data,
        },
      });
      return response.data;
    })
    .catch((err) => {
      console.log(err);
      dispatch({
        type: GET_WAVEFORM_FAILURE,
      });
    });
};

export const loadAppData = (user) => (dispatch) => {
  console.log(user);
  axios
    .get(`http://localhost:4000/api/data?user=${user}`, {
      withCredentials: true,
    })
    .then((res) =>
      res.status === 200
        ? dispatch({
            type: LOAD_SUCCESS,
            payload: res.data,
          })
        : dispatch({ type: LOAD_FAILURE })
    );
};
