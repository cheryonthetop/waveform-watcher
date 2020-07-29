import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Redirect } from "react-router-dom";
import Header from "../Header";
import EventSelection from "../EventSelection";
import "../stylesheets/index.css";
import ErrorModal from "../ErrorModal";

/**
 * The home page where user can view, cache and select
 * events to browse waveform
 */
class Home extends Component {
  componentDidMount() {
    console.log("Home Mounted");
  }

  /**
   * Renders the home page
   */
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
            <ErrorModal></ErrorModal>
          </div>
        </div>
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
export default connect(mapStateToProps, null)(Home);
