import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Redirect } from "react-router-dom";
import Header from "../Header";
import EventSelection from "../EventSelection";
import "../stylesheets/index.css";

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
            <EventSelection />
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
