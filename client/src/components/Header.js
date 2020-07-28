import React, { Component } from "react";
import { logout } from "../actions/userActions";
import { connect } from "react-redux";
import "./stylesheets/header.css";

/**
 * The header of the web pages with a title and logout link
 */
class Header extends Component {
  /**
   * Logs out the user by dispatching to a redux action
   */
  handleOnClick = () => {
    this.props.dispatch(logout());
    console.log("clicked logout");
  };

  /**
   * Renders the header
   */
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

/**
 * Connects the component to redux store. This allows
 * the action to be accessed in the component
 * @type {Component}
 */
export default connect(null, null)(Header);
