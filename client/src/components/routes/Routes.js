import React, { Component } from "react";
import { connect } from "react-redux";
import { BrowserRouter, Route } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Success from "./Success";
import Failure from "./Failure";
import Waveform from "./Waveform";

class Routes extends Component {
  componentDidMount() {}

  render() {
    console.log("Routes props", this.props.isAuthenticated);
    return (
      <BrowserRouter>
        <div style={{ height: "100vh" }}>
          <Route exact path="/login" component={Login} />
          <Route exact path="/login/success" component={Success} />
          <Route exact path="/login/failure" component={Failure} />
          <Route exact path="/waveform" component={Waveform} />
          <Route exact path="/waveform/:run/:event" component={Waveform} />
          <Route exact path="/" component={Home} />
        </div>
      </BrowserRouter>
    );
  }
}
const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps, null)(Routes);
