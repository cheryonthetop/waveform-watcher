import { ERROR_MESSAGE_REPORTED, ERROR_MESSAGE_SERVED } from "../actions/types";

/**
 * The redux initial state for error reducer
 * @property {Boolean} error - if there is an error
 * @property {String} msg - the error message if any
 * @type {Object}
 */
const initialState = {
  error: false,
  msg: "",
};

/**
 * Evaluates the action type and changes the state accordingly
 * @param {Object} state Defaults to initialState
 * @param {Object} action Usually has properties type and payload
 * @type {Function}
 */
export default function (state = initialState, action) {
  switch (action.type) {
    case ERROR_MESSAGE_REPORTED:
      return {
        ...state,
        error: true,
        msg: action.payload.msg,
        title: action.payload.title,
      };
    case ERROR_MESSAGE_SERVED:
      return {
        ...state,
        error: false,
        msg: "",
        title: "",
      };
    default:
      return state;
  }
}
