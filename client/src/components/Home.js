import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Redirect } from "react-router-dom";
import Header from "./Header";
import Waveform from "./Waveform";
import "./stylesheets/index.css";

class Home extends Component {
  componentDidMount() {
    console.log("Waveform rendered");
  }

  render() {
    if (!this.props.isAuthenticated) {
      return <Redirect to="/login" />;
    }

    return (
      <div>
        <div>
          {/* Header */}
          <Header />

          {/* Body */}
          <div className="body" style={{ textAlign: "center" }}>
            <Waveform />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps, null)(Home);
