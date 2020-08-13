import React, { Component } from "react";
import { Form } from "react-bootstrap";
import { changeEventID } from "../actions/waveformActions";
import { connect } from "react-redux";

/**
 * The input box for event ID
 */
class Events extends Component {
  handleStateChangeEvent = (event) => {
    this.props.dispatch(changeEventID(event));
  };

  /**
   * Renders the events input box
   */
  render() {
    return (
      <div>
        <strong>Event: </strong>
        <Form.Control
          type="string"
          placeholder="Enter an Integer Event ID"
          onChange={(event) => this.handleStateChangeEvent(event.target.value)}
          value={this.props.inputEventID}
        />
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
  inputEventID: state.waveform.inputEventID,
});

/**
 * Connects the component to redux store.
 * @type {Component}
 */
export default connect(mapStateToProps, null)(Events);
