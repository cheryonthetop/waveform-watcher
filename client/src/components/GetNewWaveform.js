import React, { Component } from "react";
import { getWaveform } from "../actions/waveformActions";
import { errorServed } from "../actions/errorActions";
import { Button } from "react-bootstrap";
import { connect } from "react-redux";
import ErrorModal from "./ErrorModal";

class GetNewWaveform extends Component {
  state = {
    show: false,
    repetitive: false,
  };

  handleGetWaveform = (runID, eventID) => {
    const { user, currRunID, currEventID } = this.props;
    console.log("event ID is: ", eventID);
    if (runID && eventID) {
      if (runID === currRunID && eventID === currEventID)
        this.handleShowModalRep();
      else {
        this.props.handleLoading();
        console.log(user, runID, eventID);
        this.props.dispatch(getWaveform(user, runID, eventID));
      }
    } else {
      this.handleShowModal();
    }
  };

  handleClose = () => this.setState({ show: false });

  handleShowModal = () => this.setState({ show: true });

  handleCloseRep = () => this.setState({ repetitive: false });

  handleShowModalRep = () => this.setState({ repetitive: true });

  handleCloseError = () => this.props.dispatch(errorServed());

  render() {
    const { show, repetitive } = this.state;
    const { msg, error, runID, eventID } = this.props;
    return (
      <div id="gw-div-old" style={{ marginTop: "10px" }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => this.handleGetWaveform(runID, eventID)}
          active
        >
          Get New Waveform
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const previous = parseInt(eventID) - 1;
            this.handleGetWaveform(runID, previous.toString());
          }}
          active
          style={{ marginTop: "10px" }}
        >
          Get Previous Event
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const previous = parseInt(eventID) + 1;
            this.handleGetWaveform(runID, previous.toString());
          }}
          active
          style={{ marginTop: "10px" }}
        >
          Get Next Event
        </Button>
        <ErrorModal
          title="Get New Waveform Error"
          body="You need to enter a run ID to get a new Waveform"
          show={show}
          handleClose={this.handleClose}
        />
        <ErrorModal
          title="You are already looking at this event"
          body="Use a different run ID or event ID"
          show={repetitive}
          handleClose={this.handleCloseRep}
        />
        <ErrorModal
          title="Get New Waveform Error"
          body={msg}
          show={error}
          handleClose={this.handleCloseError}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  currRunID: state.waveform.runID,
  currEventID: state.waveform.eventID,
  error: state.error.error,
  msg: state.error.msg,
});
export default connect(mapStateToProps, null)(GetNewWaveform);
