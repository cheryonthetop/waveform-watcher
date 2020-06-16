import React, { Component } from "react";
import { connect } from "react-redux";
import { authenticate } from "../actions/userActions";
import "./stylesheets/login.css";
import { Redirect } from "react-router-dom";

class Login extends Component {
  componentDidMount() {
    // attempts to authenticate (maybe remembers me)
    this.props.dispatch(authenticate());
    console.log("lifecycle method called");
  }

  render() {
    if (this.props.isAuthenticated) {
      return <Redirect to="/" />;
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
            <div className="block">
              <strong style={{ font: 400 }}>Username</strong>
              <br />
              <input type="text" className="form-control" />
            </div>

            <div className="block">
              <strong style={{ font: 400 }}>Password</strong>
              <br />
              <input type="password" className="form-control" />
            </div>

            <div className="github">
              <a
                className="btn btn-block btn-social btn-large btn-github"
                style={{ maxWidth: "300px" }}
                href="http://localhost:5000/auth/github"
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
