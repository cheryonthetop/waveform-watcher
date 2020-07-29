import { ERROR_MESSAGE_REPORTED, ERROR_MESSAGE_SERVED } from "./types";

/**
 * Indicates the error modal has been shown
 * Changes the error state to false
 * @type {Function}
 */
export const errorServed = () => (dispatch) => {
  dispatch({
    type: ERROR_MESSAGE_SERVED,
  });
};

/**
 * An error message received from HTTP response to be
 * shown in the error modal. Dispatches the message to
 * the error reducer and changes the state of error to true
 * @type {Function}
 * @param {string} msg The message to be reported
 */
export const errorReported = (title, msg) => (dispatch) => {
  dispatch({
    type: ERROR_MESSAGE_REPORTED,
    payload: { title: title, msg: msg },
  });
};
