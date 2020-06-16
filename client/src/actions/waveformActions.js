import { GET_WAVEFORM, LOAD_SUCCESS, LOAD_FAILURE } from "./types";
import axios from "axios";

export const getWaveform = (run_id, build_low_level) => (dispatch) => {
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
    run_id: run_id,
    build_low_level: build_low_level,
  });

  axios
    .post("http://localhost:4000/api/gw", body, config)
    .then(function (response) {
      console.log(response.data);
      dispatch({
        type: GET_WAVEFORM,
        payload: {
          run_id: run_id,
          build_low_level: build_low_level,
          bokeh_json: response.data,
        },
      });
      return response.data;
    })
    .catch((err) => console.log(err));
};

export const loadAppData = (user) => (dispatch) => {
  console.log(user);
  axios
    .get(`http://localhost:4000/api/data?user=${user}`, {
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
