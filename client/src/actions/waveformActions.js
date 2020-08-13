import {
  GET_WAVEFORM_SUCCESS,
  GET_WAVEFORM_FAILURE,
  SAVE_WAVEFORM_SUCCESS,
  SAVE_WAVEFORM_FAILURE,
  LOAD_SUCCESS,
  LOAD_FAILURE,
  DELETE_WAVEFORM_FAILURE,
  DELETE_WAVEFORM_SUCCESS,
  GET_EVENT_PLOT_SUCCESS,
  GET_EVENT_PLOT_FAILURE,
  GETTING_WAVEFORM,
  CHANGE_EVENT_ID,
  CHANGE_EVENT_INPUT_RUN,
  CHANGE_WAVEFORM_INPUT_RUN,
} from "./types";
import axios from "axios";
import { errorReported } from "./errorActions";

/**
 * Gets waveform with an API request to the flask server and
 * dispatches the data to the waveform reducer
 * @type {Function}
 * @param {String} user the username
 * @param {String} runID The run ID
 * @param {Number} eventID The event ID
 */
export const getWaveform = (user, runID, eventID) => (dispatch) => {
  console.log(runID);
  // Make sure get waveforms don't interfere with each other is user
  // calls multiple times (return the latest)
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

  dispatch({
    type: GETTING_WAVEFORM,
    payload: {
      runID: runID,
      eventID: eventID,
    },
  });

  const url = `${
    process.env.REACT_APP_FLASK_BACKEND_URL
  }/api/gw?token=${window.localStorage.getItem("token")}`;

  axios
    .post(url, body, config)
    .then(function (res) {
      console.log(res.data);
      if (requestID !== window.localStorage.getItem("requestID")) return;
      if (res.data.err_msg) {
        const title = "Get Waveform Failure";
        dispatch(errorReported(title, res.data.err_msg));
        dispatch({
          type: GET_WAVEFORM_FAILURE,
        });
      } else
        dispatch({
          type: GET_WAVEFORM_SUCCESS,
          payload: {
            runID: runID,
            eventID: eventID,
            waveform: res.data,
          },
        });
    })
    .catch((err) => {
      console.log(err);
      dispatch({
        type: GET_WAVEFORM_FAILURE,
      });
      const title = "Get Waveform Failure";
      if (err.response) {
        if (err.response.status === 403) {
          const msg = `Get Waveform of Run ${runID} and Event ${eventID} 
          Failed. Make sure you are not logged in from another device or browser`;
          dispatch(errorReported(title, msg));
        } else {
          const msg = `Get Waveform of Run ${runID} and Event ${eventID} Failed. 
          This could be an internal server error. Please try again or contact
          Rice Astroparticle group for help`;
          dispatch(errorReported(title, msg));
        }
      }
    });
};

/**
 * Gets events with an API request to the flask server and
 * dispatches the data to the waveform reducer
 * @type {Function}
 * @param {String} user The username
 * @param {Number} runID The run ID
 */
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
      const title = "Get Events Failure";
      if (err.response) {
        if (err.response.status === 403) {
          const msg = `Get Events of Run ${runID} Failed. Make sure 
          you are not logged in from another device or browser`;
          dispatch(errorReported(title, msg));
        } else {
          const msg = `Get Events of Run ${runID} Failed. This 
          could be an internal server error. Please try again or contact
          Rice Astroparticle group for help`;
          dispatch(errorReported(title, msg));
        }
      }
    });
};

/**
 * Saves tags and comments along with the waveform
 * with an API request to the flask server
 * @type {Function}
 * @param {String} user The username
 * @param {String} tag The tag
 * @param {String} comments The comments
 * @param {String} runID The run ID
 * @param {Number} eventID The event ID
 */
export const saveWaveform = (user, tag, comments, runID, eventID) => (
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
          payload: {
            tag: tag,
            runID: runID,
            eventID: eventID,
            comments: comments,
          },
        });
      }
    })
    .catch((err) => {
      console.log(err);
      dispatch({
        type: SAVE_WAVEFORM_FAILURE,
      });
      const title = "Delete Tag Failure";
      if (err.response) {
        if (err.response.status === 403) {
          const msg = `Delete Tag ${tag} Failed. Make sure you
          are not logged in from another device or browser`;
          dispatch(errorReported(title, msg));
        } else {
          const msg = `Delete Tag ${tag} Failed. This could 
          be an internal server error. Please try again or contact
          Rice Astroparticle group for help`;
          dispatch(errorReported(title, msg));
        }
      }
    });
};

/**
 * Deletes the tag (and therefore the waveform associated with it)
 * with an API request to the flask server
 * @type {Function}
 * @param {String} user The username
 * @param {String} tag The tag to delete
 */
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
          payload: {
            tag: tag,
          },
        });
      }
    })
    .catch((err) => {
      console.log(err);
      dispatch({
        type: DELETE_WAVEFORM_FAILURE,
      });
      const title = "Delete Tag Failure";
      if (err.response) {
        if (err.response.status === 403) {
          const msg = `Delete Tag ${tag} Failed. Make sure you
          are not logged in from another device or browser`;
          dispatch(errorReported(title, msg));
        } else {
          const msg = `Delete Tag ${tag} Failed. This could 
          be an internal server error. Please try again or contact
          Rice Astroparticle group for help`;
          dispatch(errorReported(title, msg));
        }
      }
    });
};

/**
 * Loads app data with an API request to the flask server and
 * dispatches the data to the waveform reducer
 * @type {Function}
 * @param {String} user The username
 */
export const loadAppData = (user) => (dispatch) => {
  window.localStorage.setItem("requestID", "0");
  console.log(user);
  const url = `${
    process.env.REACT_APP_FLASK_BACKEND_URL
  }/api/data?user=${user}&token=${window.localStorage.getItem("token")}`;

  axios
    .get(url)
    .then((res) =>
      dispatch({
        type: LOAD_SUCCESS,
        payload: res.data,
      })
    )
    .catch((err) => {
      dispatch({ type: LOAD_FAILURE });
      if (err.response) {
        const title = "Load User Data Failure";
        if (err.response.status === 403) {
          const msg = `Load User Data Failed. Make sure you
        are not logged in from another device or browser`;
          dispatch(errorReported(title, msg));
        } else {
          const msg = `Load User Data Failed. This could 
        be an internal server error. Please try again or contact
        Rice Astroparticle group for help`;
          dispatch(errorReported(title, msg));
        }
      }
    });
};

/**
 * Updates the newest user input of run ID
 * @type {Function}
 * @param {String} runID The new user input in the waveform page
 */
export const changeWaveformInputRunID = (runID) => (dispatch) => {
  dispatch({ type: CHANGE_WAVEFORM_INPUT_RUN, payload: { runID: runID } });
};
/**
 * Updates the newest user input of run ID
 * @type {Function}
 * @param {String} runID The new user input in the event page
 */
export const changeEventInputRunID = (runID) => (dispatch) => {
  dispatch({ type: CHANGE_EVENT_INPUT_RUN, payload: { runID: runID } });
};
/**
 * Updates the newest user input of run ID
 * @type {Function}
 * @param {Number} runID The new user input in the waveform page
 */
export const changeEventID = (eventID) => (dispatch) => {
  dispatch({ type: CHANGE_EVENT_ID, payload: { eventID: eventID } });
};
