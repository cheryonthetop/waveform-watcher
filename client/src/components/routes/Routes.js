import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Success from "./Success";
import Failure from "./Failure";
import Waveform from "./Waveform";
import WaveformURL from "./WaveformURL";

export default class Routes extends Component {
  /**
   * Renders the routes with react router
   */
  render() {
    return (
      <BrowserRouter>
        <div style={{ height: "100vh" }}>
          <Route exact path="/login" component={Login} />
          <Route exact path="/login/success" component={Success} />
          <Route exact path="/login/failure" component={Failure} />
          <Route exact path="/waveform" component={Waveform} />
          <Route exact path="/waveform/:run/:event" component={WaveformURL} />
          <Route exact path="/" component={Home} />
        </div>
      </BrowserRouter>
    );
  }
}
