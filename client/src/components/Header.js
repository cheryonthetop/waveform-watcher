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
          <div id="title" style={{ marginRight: "25%" }}>
            Waveform Watcher
            <span id="software">
              strax: {this.props.strax ? this.props.strax : "Still Loading ..."}{" "}
              <br /> straxen:{" "}
              {this.props.straxen ? this.props.straxen : "Still Loading ..."}
            </span>
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
 * Maps the central state to props in this page
 * @param {Object} state The central state in redux store
 * @type {Function}
 */
const mapStateToProps = (state) => ({
  strax: state.waveform.strax,
  straxen: state.waveform.straxen,
});

/**
 * Connects the component to redux store. This allows
 * the action to be accessed in the component
 * @type {Component}
 */
export default connect(mapStateToProps, null)(Header);
