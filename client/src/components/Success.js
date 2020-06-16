import React, { Component } from "react";
import { authenticate } from "../actions/userActions";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";

class Success extends Component {
  componentDidMount() {
    this.props.dispatch(authenticate());
    this.render();
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
