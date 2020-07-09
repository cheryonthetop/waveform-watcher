import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";
import queryString from "query-string";

class Success extends Component {
  componentDidMount() {
    var query = queryString.parse(this.props.location.search);
    if (query.token) {
      window.localStorage.setItem("token", query.token);
      this.props.history.push("/");
    }
  }

  render() {
    if (this.props.isAuthenticated) {
      return <Redirect to="/" />;
    }

    return (
      <div>
        <h2>Login succeeded: Redirecting... </h2>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps, null)(Success);
