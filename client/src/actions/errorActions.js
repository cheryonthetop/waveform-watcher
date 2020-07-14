import { ERROR_MESSAGE_REPORTED, ERROR_MESSAGE_SERVED } from "./types";

export const errorServed = () => (dispatch) => {
  dispatch({
    type: ERROR_MESSAGE_SERVED,
  });
};

export const errorReported = (msg) => (dispatch) => {
  dispatch({
    type: ERROR_MESSAGE_REPORTED,
    payload: msg,
  });
};
