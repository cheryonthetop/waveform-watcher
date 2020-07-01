import React, { Component } from "react";
import "./stylesheets/header.css";

export default class Header extends Component {
  render() {
    return (
      <div id="header">
        <div style={{ textAlign: "center" }}>
          <div style={{ marginRight: "25%" }}>
            <h2 id="title">Waveform watcher</h2>
          </div>
        </div>
        <div id="logout">
          <a
            href={process.env.REACT_APP_NODE_BACKEND_URL + "/logout"}
            onClick={this.handleOnClick}
            style={{ color: "white" }}
          >
            Logout
          </a>
        </div>
      </div>
    );
  }
}
