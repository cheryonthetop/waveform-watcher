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
  GET_EVENT_PLOT_SUCCESS,
  GET_EVENT_PLOT_FAILURE,
} from "./types";
import axios from "axios";
import { errorReported } from "./errorActions";

export const getWaveform = (user, run_id, event_id) => (dispatch) => {
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
    event_id: event_id,
  });

  axios
    .post(`${process.env.REACT_APP_FLASK_BACKEND_URL}/api/gw`, body, config)
    .then(function (res) {
      console.log(res.data);
      if (res.data.err_msg) dispatch(errorReported(res.data.err_msg));
      else
        dispatch({
          type: GET_WAVEFORM_SUCCESS,
          payload: {
            run_id: run_id,
            event_id: event_id,
            waveform: res.data,
          },
        });
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      dispatch({
        type: GET_WAVEFORM_FAILURE,
      });
    });
};

export const getEventPlot = (user, run_id, event_id) => (dispatch) => {
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
    event_id: event_id,
  });

  axios
    .post(`${process.env.REACT_APP_FLASK_BACKEND_URL}/api/ge`, body, config)
    .then(function (res) {
      console.log(res.data);
      dispatch({
        type: GET_EVENT_PLOT_SUCCESS,
        payload: {
          run_id: run_id,
          event_id: event_id,
          eventPlot: res.data,
        },
      });
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      dispatch({
        type: GET_EVENT_PLOT_FAILURE,
      });
    });
};

export const saveWaveform = (
  user,
  tag,
  comments,
  waveform,
  run_id,
  event_id
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
    waveform: waveform,
    run_id: run_id,
    event_id: event_id,
  });

  axios
    .post(`${process.env.REACT_APP_FLASK_BACKEND_URL}/api/sw`, body, config)
    .then(function (res) {
      console.log(res.data);
      if (res.status === 200) {
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

export const switchWaveform = (run_id, event_id, waveform) => (dispatch) => {
  dispatch({
    type: SWITCH_WAVEFORM,
    payload: {
      run_id: run_id,
      event_id: event_id,
      waveform: waveform,
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
    .post(`${process.env.REACT_APP_FLASK_BACKEND_URL}/api/dw`, body, config)
    .then(function (res) {
      console.log(res.data);
      if (res.status === 200) {
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
    .get(`${process.env.REACT_APP_FLASK_BACKEND_URL}/api/data?user=${user}`, {
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
