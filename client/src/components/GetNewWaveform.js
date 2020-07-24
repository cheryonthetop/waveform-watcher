import React, { Component } from "react";
import { getWaveform } from "../actions/waveformActions";
import { errorServed } from "../actions/errorActions";
import { Button } from "react-bootstrap";
import { connect } from "react-redux";
import ErrorModal from "./ErrorModal";

class GetNewWaveform extends Component {
  state = {
    noRun: false,
    noEvent: false,
    repetitive: false,
    eventIsNotInt: false,
    eventIsNeg: false,
  };

  handleGetWaveform = (runID, eventID) => {
    const { user, currRunID, currEventID } = this.props;
    if (runID && eventID) {
      if (runID === currRunID && eventID === currEventID)
        this.handleShowModalRep();
      else if (isNaN(parseInt(eventID)) || !Number.isInteger(parseInt(eventID)))
        this.handleShowModalEventIsNotInt();
      else if (eventID < 0) this.handleShowModalEventIsNeg();
      else {
        this.props.handleLoading();
        console.log(user, runID, eventID);
        this.props.dispatch(getWaveform(user, runID, eventID));
      }
    } else {
      if (!runID && !eventID) this.handleShowModalNoRunNoEvent();
      else if (!runID) this.handleShowModalNoRun();
      else if (!eventID) this.handleShowModalNoEvent();
    }
  };

  handleCloseNoRun = () => this.setState({ noRun: false });

  handleShowModalNoRun = () => this.setState({ noRun: true });

  handleCloseNoEvent = () => this.setState({ noEvent: false });

  handleShowModalNoEvent = () => this.setState({ noEvent: true });

  handleCloseNoRunNoEvent = () =>
    this.setState({ noRun: false, noEvent: false });

  handleShowModalNoRunNoEvent = () =>
    this.setState({ noRun: true, noEvent: true });

  handleCloseEventIsNotInt = () => this.setState({ eventIsNotInt: false });

  handleShowModalEventIsNotInt = () => this.setState({ eventIsNotInt: true });

  handleCloseEventIsNeg = () => this.setState({ eventIsNeg: false });

  handleShowModalEventIsNeg = () => this.setState({ eventIsNeg: true });

  handleCloseRep = () => this.setState({ repetitive: false });

  handleShowModalRep = () => this.setState({ repetitive: true });

  handleCloseError = () => this.props.dispatch(errorServed());

  render() {
    const {
      noRun,
      noEvent,
      repetitive,
      eventIsNotInt,
      eventIsNeg,
    } = this.state;
    const { msg, error, runID, eventID, currRunID, currEventID } = this.props;
    return (
      <div id="gw-div-old" style={{ marginTop: "10px" }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => this.handleGetWaveform(runID, parseInt(eventID))}
          active
        >
          Get New Waveform
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const previous = currEventID ? parseInt(currEventID) - 1 : "";
            this.handleGetWaveform(currRunID, previous);
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
            const next = currEventID ? parseInt(currEventID) + 1 : "";
            this.handleGetWaveform(currRunID, next);
          }}
          active
          style={{ marginTop: "10px" }}
        >
          Get Next Event
        </Button>
        <ErrorModal
          title="Get New Waveform Error"
          body="You Need To Enter an Run ID to Get a New Waveform"
          show={noRun}
          handleClose={this.handleCloseNoRun}
        />
        <ErrorModal
          title="Get New Waveform Error"
          body="You Need To Enter an Event ID to Get a New Waveform"
          show={noEvent}
          handleClose={this.handleCloseNoEvent}
        />
        <ErrorModal
          title="Get New Waveform Error"
          body="You Need To Enter a Run ID and an Event ID to Get a New Waveform"
          show={noEvent && noRun}
          handleClose={this.handleCloseNoRunNoEvent}
        />
        <ErrorModal
          title="You are already looking at this event"
          body="Use a different run ID or event ID"
          show={repetitive}
          handleClose={this.handleCloseRep}
        />
        <ErrorModal
          show={eventIsNotInt}
          handleClose={this.handleCloseEventIsNotInt}
          title="Input Error"
          body="Event ID Must Be Integer"
        />
        <ErrorModal
          show={eventIsNeg}
          handleClose={this.handleCloseEventIsNeg}
          title="Input Error"
          body="Event ID Must Not Be Negative"
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
