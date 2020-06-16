import { AUTH_SUCCESS, AUTH_ERROR, LOGOUT } from "./types";
import { loadAppData } from "./waveformActions";
import axios from "axios";

// Check token & load user
export const authenticate = () => (dispatch) => {
  console.log("authenticate action called");

  axios
    .get("http://localhost:5000/auth", { withCredentials: true })
    .then((res) => {
      console.log("Auth response with status" + res.data["status"]);
      if (res.data["status"] === 200) {
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
  dispatch({
    type: LOGOUT,
  });
};

const config = {
  headers: {
    "Content-type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
};
