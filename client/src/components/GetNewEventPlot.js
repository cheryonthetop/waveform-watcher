import React, { Component } from "react";
import { getEventPlot } from "../actions/waveformActions";
import { Button, Modal } from "react-bootstrap";
import { connect } from "react-redux";

class GetNewEventPlot extends Component {
  state = {
    show: false,
  };

  handleGetEventPlot = () => {
    const { user, runID, eventID } = this.props;
    if (runID) {
      this.props.handleLoading();
      console.log(user, runID, eventID);
      this.props.dispatch(getEventPlot(user, runID, eventID));
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
          onClick={this.handleGetEventPlot}
          active
        >
          View Events
        </Button>
        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Get Event Plot error</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            You need to enter a run id to view event plots!
          </Modal.Body>
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

export default connect(null, null)(GetNewEventPlot);
