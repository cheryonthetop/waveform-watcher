import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";
import queryString from "query-string";
import { authenticate } from "../../actions/userActions";

class Success extends Component {
  /**
   * Redirects the user to the URL it asks for before
   * being redirected to login
   */
  componentDidMount() {
    var query = queryString.parse(this.props.location.search);
    if (query.token) {
      window.localStorage.setItem("token", query.token);
      this.props.dispatch(authenticate());
    }
  }

  /**
   * Renders the login success message
   */
  render() {
    if (this.props.isAuthenticated) {
      const pathname = window.localStorage.getItem("redirect");
      window.localStorage.removeItem("redirect");
      return pathname ? <Redirect to={pathname} /> : <Redirect to="/" />;
    }

    return (
      <div>
        <h2>Login succeeded: Redirecting... </h2>
      </div>
    );
  }
}

/**
 * Maps the central state to props in this page
 * @param {Object} state The central state in redux store
 * @type {Function}
 */
const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

/**
 * Connects the component to redux store
 * @type {Component}
 */
export default connect(mapStateToProps, null)(Success);
