import React, { Component } from "react";
import { connect } from "react-redux";

/**
 * Shows the run ID and event ID of the waveform being shown
 */
class Param extends Component {
  /**
   * Renders the parameter input boxes
   */
  render() {
    return (
      <div id="param" hidden={this.props.hidden}>
        <strong>Run ID: </strong>
        <input defaultValue={this.props.runID} readOnly></input>
        <strong style={{ marginLeft: "10px" }}>Event: </strong>
        <input defaultValue={this.props.eventID} readOnly></input>
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
  runID: state.waveform.runID,
  eventID: state.waveform.eventID,
  waveform: state.waveform.waveform,
});

/**
 * Connects the component to redux store. Exposes the component
 * to react router dom to allow redirecting through history
 * @type {Component}
 */
export default connect(mapStateToProps, null)(Param);
