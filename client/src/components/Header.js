import React, { Component } from "react";
import { logout } from "../actions/userActions";
import { connect } from "react-redux";
import "./stylesheets/header.css";

class Header extends Component {
  handleOnClick = () => {
    this.props.dispatch(logout());
    console.log("clicked logout");
  };

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

const mapStateToProps = (state) => ({});

export default connect(mapStateToProps, null)(Header);
