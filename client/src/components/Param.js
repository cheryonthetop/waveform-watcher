import React, { Component } from "react";

export default class Param extends Component {
  render() {
    return (
      <div
        id="param"
        style={{ paddingTop: "20px" }}
        hidden={this.props.bokeh_model === undefined}
      >
        <strong>Run ID: </strong>
        <input defaultValue={this.props.run_id} readOnly></input>
        <strong style={{ marginLeft: "10px" }}>Event: </strong>
        <input defaultValue={this.props.event} readOnly></input>
      </div>
    );
  }
}
