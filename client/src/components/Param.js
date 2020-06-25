import React, { Component } from "react";

export default class Param extends Component {
  render() {
    return (
      <div id="param" style={{ paddingTop: "20px" }}>
        <strong>Run ID: </strong>
        <input value={this.props.run_id} contentEditable={false}></input>
        <strong style={{ marginLeft: "10px" }}>Build Low Level: </strong>
        <input
          value={this.props.build_low_level}
          contentEditable={false}
        ></input>
      </div>
    );
  }
}
