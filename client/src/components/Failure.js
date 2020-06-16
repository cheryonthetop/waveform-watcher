import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";

class Failure extends Component {
  componentDidMount() {
    setTimeout(() => {
      this.render();
    }, 10000);
  }

  render() {
    if (!this.props.isAuthenticated) {
      return <Redirect to="/login" />;
    }

    return (
      <div>
        <h2>Login failed: Redirecting... </h2>
        <h5>
          Login could fail because your github is not part of the XENON
          organization
        </h5>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps, null)(Failure);
