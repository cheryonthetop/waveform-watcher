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
        <Select
          options={[{ label: "1" }, { label: "2" }, { label: "3" }]}
          onChange={this.handleStateChangeEvent}
        />
      </div>
    );
  }
}
