import { AUTH_SUCCESS, AUTH_ERROR, LOGOUT } from "./types";
import { loadAppData } from "./waveformActions";
import axios from "axios";

// Check token & load user
export const authenticate = () => (dispatch) => {
  console.log("authenticate action called");
  const url =
    process.env.REACT_APP_NODE_BACKEND_URL +
    "/auth?token=" +
    window.localStorage.getItem("token");

  axios
    .get(url, {
      withCredentials: true,
    })
    .then((res) => {
      console.log("Auth response with status " + res.status);
      console.log("response" + JSON.stringify(res.data));
      if (res.status === 200) {
        dispatch({
          type: AUTH_SUCCESS,
          payload: res.data,
        });
        dispatch(loadAppData(res.data.user));
      } else {
        dispatch({
          type: AUTH_ERROR,
        });
      }
    })
    .catch((err) => {
      // dispatch(returnErrors(err.response.data, err.response.status));
      console.log(err);
      dispatch({
        type: AUTH_ERROR,
      });
    });
};

export const logout = () => (dispatch) => {
  console.log("logout action called");
  window.localStorage.removeItem("token");
  console.log(window.localStorage.getItem("token"));
  dispatch({
    type: LOGOUT,
  });
};
