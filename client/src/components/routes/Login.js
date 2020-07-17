import React, { Component } from "react";
import { connect } from "react-redux";
import "../stylesheets/login.css";
import { Redirect } from "react-router-dom";

class Login extends Component {
  render() {
    if (this.props.isAuthenticated) {
      const pathname = window.localStorage.getItem("redirect");
      window.localStorage.removeItem("redirect");
      return pathname ? <Redirect to={pathname} /> : <Redirect to="/" />;
    }

    return (
      <div id="container">
        <div className="row" style={{ paddingTop: "5%" }}>
          <div className="col-md-4 col-sm-3 col-xs-1" />
          <div
            className="col-md-4 col-sm-6 col-xs-9"
            style={{ backgroundColor: "cadetblue", borderColor: "#aaaaaa" }}
          >
            <br />
            <h5>Welcome to Waveform Watcher</h5>
            <div className="github">
              <a
                className="btn btn-block btn-social btn-large btn-github"
                style={{ maxWidth: "300px" }}
                href={process.env.REACT_APP_NODE_BACKEND_URL + "/auth/github"}
              >
                <i className="fab fa-github" />
                <span>Login with GitHub</span>
              </a>
            </div>
            <br />
            <div className="row" style={{ paddingTop: "100px" }} />
          </div>
        </div>
      </div>
    );
  }
}

const mapStatetoProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});
export default connect(mapStatetoProps, null)(Login);
