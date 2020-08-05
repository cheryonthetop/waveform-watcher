import React, { Component } from "react";
import { Button } from "react-bootstrap";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { connect } from "react-redux";

const app_url = "https://waveform-watcher.azurewebsites.net/waveform";

class GetShareLink extends Component {
  /**
   * @property {Boolean} copySuccess - if the value is copied to clipboard
   */
  state = {
    copySuccess: false,
  };

  render() {
    return (
      <div>
        <CopyToClipboard
          text={app_url + this.props.runID + this.props.eventID}
          onCopy={() => this.setState({ copySuccess: true })}
        >
          <Button variant="dark" size="sm">
            Get Shareable Link
          </Button>
        </CopyToClipboard>

        {this.state.copySuccess ? (
          <span style={{ color: "green" }}>Copied.</span>
        ) : null}
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
  waveform: state.waveform.waveform,
  runID: state.waveform.runID,
  eventID: state.waveform.eventID,
});

/**
 * Connects the component to redux store.
 * @type {Component}
 */
export default connect(mapStateToProps, null)(GetShareLink);
