import {
  AUTH_ERROR,
  AUTH_SUCCESS,
  LOGIN_SUCCESS,
  LOGIN_ERROR,
  LOGOUT,
} from "../actions/types";

const initialState = {
  id: "",
  isAuthenticated: null,
  user: "",
};

export default function (state = initialState, action) {
  action.payload
    ? console.log(
        "received action of type " +
          action.type +
          " and data " +
          JSON.stringify(action.payload).toString().slice(0, 100)
      )
    : console.log("received action of type " + action.type);
  switch (action.type) {
    case AUTH_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        id: action.payload.id,
      };
    case LOGOUT:
    case AUTH_ERROR:
    case LOGIN_ERROR:
      return {
        ...state,
        isAuthenticated: false,
      };
    case LOGIN_SUCCESS:
    default:
      return state;
  }
}
