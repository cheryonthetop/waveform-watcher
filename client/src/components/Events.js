import React, { Component } from "react";
import { Form } from "react-bootstrap";

/**
 * The input box for event ID
 */
export default class Events extends Component {
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
          onChange={(event) =>
            this.props.handleStateChangeEvent(event.target.value)
          }
        />
      </div>
    );
  }
}
