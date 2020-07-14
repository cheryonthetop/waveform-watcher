import { ERROR_MESSAGE_REPORTED, ERROR_MESSAGE_SERVED } from "../actions/types";

const initialState = {
  error: false,
  msg: "",
};

export default function (state = initialState, action) {
  switch (action.type) {
    case ERROR_MESSAGE_REPORTED:
      return {
        ...state,
        error: true,
        msg: action.payload,
      };
    case ERROR_MESSAGE_SERVED:
      return {
        ...state,
        error: false,
      };
    default:
      return state;
  }
}
