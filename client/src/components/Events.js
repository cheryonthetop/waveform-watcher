import React, { Component } from "react";
import { Form } from "react-bootstrap";

export default class Events extends Component {
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
