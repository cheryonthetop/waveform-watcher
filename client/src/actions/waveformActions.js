import {
  GET_WAVEFORM_SUCCESS,
  GET_WAVEFORM_FAILURE,
  SAVE_WAVEFORM_SUCCESS,
  SAVE_WAVEFORM_FAILURE,
  LOAD_SUCCESS,
  LOAD_FAILURE,
  SWITCH_WAVEFORM,
  DELETE_WAVEFORM_FAILURE,
  DELETE_WAVEFORM_SUCCESS,
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
  user,
  tag,
  comments,
  bokeh_model,
  run_id,
  build_low_level
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
    user: user,
    tag: tag,
    comments: comments,
    bokeh_model: bokeh_model,
    run_id: run_id,
    build_low_level: build_low_level,
  });

  axios
    .post("http://localhost:4000/api/sw", body, config)
    .then(function (response) {
      console.log(response.data);
      if (response.status === 200) {
        dispatch({
          type: SAVE_WAVEFORM_SUCCESS,
        });
      } else {
        dispatch({ type: SAVE_WAVEFORM_FAILURE });
      }
    })
    .catch((err) => {
      console.log(err);
      dispatch({
        type: SAVE_WAVEFORM_FAILURE,
      });
    });
};

export const switchWaveform = (run_id, build_low_level, bokeh_model) => (
  dispatch
) => {
  dispatch({
    type: SWITCH_WAVEFORM,
    payload: {
      run_id: run_id,
      build_low_level: build_low_level,
      bokeh_model: bokeh_model,
    },
  });
};

export const deleteWaveform = (user, tag) => (dispatch) => {
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
    tag: tag,
  });

  axios
    .post("http://localhost:4000/api/dw", body, config)
    .then(function (response) {
      console.log(response.data);
      if (response.status === 200) {
        dispatch({
          type: DELETE_WAVEFORM_SUCCESS,
        });
      } else {
        dispatch({ type: DELETE_WAVEFORM_FAILURE });
      }
    })
    .catch((err) => {
      console.log(err);
      dispatch({
        type: DELETE_WAVEFORM_FAILURE,
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
