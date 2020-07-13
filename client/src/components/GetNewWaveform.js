import React, { Component } from "react";
import { getWaveform } from "../actions/waveformActions";
import { Button, Modal } from "react-bootstrap";
import { connect } from "react-redux";

class GetNewWaveform extends Component {
  state = {
    show: false,
  };

  handleGetWaveform = () => {
    const { user, runID, eventID } = this.props;
    if (runID) {
      this.props.handleLoading();
      console.log(user, runID, eventID);
      this.props.dispatch(getWaveform(user, runID, eventID));
    } else {
      this.handleShow();
    }
  };

  handleClose = () => this.setState({ show: false });

  handleShow = () => this.setState({ show: true });

  render() {
    return (
      <div id="gw-div-old" style={{ marginTop: "10px" }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={this.handleGetWaveform}
          active
        >
          Get New Waveform
        </Button>
        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Get Waveform error</Modal.Title>
          </Modal.Header>
          <Modal.Body>You need to enter a run id to get a waveform!</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export default connect(null, null)(GetNewWaveform);
