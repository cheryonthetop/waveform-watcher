import React, { Component } from "react";
import Select from "react-select";

export default class Events extends Component {
  handleStateChangeEvent = (value, { action, removedValue }) => {
    switch (action) {
      case "select-option":
        this.props.handleStateChangeEvent(value);
    }
  };
  render() {
    return (
      <div>
        <strong>Event: </strong>
        <Select options={[]} onChange={this.handleStateChangeEvent} />
      </div>
    );
  }
}
