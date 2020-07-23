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

export const getWaveform = (user, runID, eventID) => (dispatch) => {
  console.log(runID);
  // Make sure get waveform and switch waveform don't interfere
  const requestID = (
    parseInt(window.localStorage.getItem("requestID")) + 1
  ).toString();
  window.localStorage.setItem("requestID", requestID);
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
    run_id: runID,
    event_id: eventID,
  });

  const url = `${
    process.env.REACT_APP_FLASK_BACKEND_URL
  }/api/gw?token=${window.localStorage.getItem("token")}`;

  axios
    .post(url, body, config)
    .then(function (res) {
      console.log(res.data);
      if (res.data.requestID !== window.localStorage.getItem("requestID"))
        return;
      if (res.data.err_msg) dispatch(errorReported(res.data.err_msg));
      else
        dispatch({
          type: GET_WAVEFORM_SUCCESS,
          payload: {
            runID: runID,
            eventID: eventID,
            waveform: res.data.waveform,
          },
        });
    })
    .catch((err) => {
      console.log(err);
      dispatch({
        type: GET_WAVEFORM_FAILURE,
      });
    });
};

export const getEventPlot = (user, runID) => (dispatch) => {
  console.log(runID);
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
    run_id: runID,
  });

  const url = `${
    process.env.REACT_APP_FLASK_BACKEND_URL
  }/api/ge?token=${window.localStorage.getItem("token")}`;

  axios
    .post(url, body, config)
    .then(function (res) {
      console.log(res.data);
      dispatch({
        type: GET_EVENT_PLOT_SUCCESS,
        payload: {
          eventPlot: res.data.eventPlot,
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

export const saveWaveform = (user, tag, comments, waveform, runID, eventID) => (
  dispatch
) => {
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
    run_id: runID,
    event_id: eventID,
  });

  const url = `${
    process.env.REACT_APP_FLASK_BACKEND_URL
  }/api/sw?token=${window.localStorage.getItem("token")}`;

  axios
    .post(url, body, config)
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

export const switchWaveform = (runID, eventID, waveform) => (dispatch) => {
  // Make sure get waveform and switch waveform don't interfere
  const requestID = (
    parseInt(window.localStorage.getItem("requestID")) + 1
  ).toString();
  window.localStorage.setItem("requestID", requestID);
  dispatch({
    type: SWITCH_WAVEFORM,
    payload: {
      runID: runID,
      eventID: eventID,
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

  const url = `${
    process.env.REACT_APP_FLASK_BACKEND_URL
  }/api/dw?token=${window.localStorage.getItem("token")}`;

  axios
    .post(url, body, config)
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
  window.localStorage.setItem("requestID", "0");
  console.log(user);
  const url = `${
    process.env.REACT_APP_FLASK_BACKEND_URL
  }/api/data?user=${user}&token=${window.localStorage.getItem("token")}`;

  axios.get(url).then((res) =>
    res.status === 200
      ? dispatch({
          type: LOAD_SUCCESS,
          payload: res.data,
        })
      : dispatch({ type: LOAD_FAILURE })
  );
};
