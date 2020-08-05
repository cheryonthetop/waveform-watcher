import React, { Component } from "react";

/**
 * Shows the run ID and event ID of the waveform being shown
 */
export default class Param extends Component {
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
