import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";

/**
 * Shows the login failure message
 */
class Failure extends Component {
  /**
   * Renders the failure messge
   */
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
