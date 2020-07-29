import React, { Component } from "react";
import { getWaveform } from "../actions/waveformActions";
import { Button } from "react-bootstrap";
import { connect } from "react-redux";
import ErrorModal from "./ErrorModal";

/**
 * A get waveform button
 */
class GetNewWaveform extends Component {
  /**
   * @property {Boolean} noRun - if no run ID is supplied
   * @property {Boolean} noEvent - if no event ID is supplied
   * @property {Boolean} repetitve - if the asked waveform is already in the page
   * @property {Boolean} eventIsNotInt - if the event ID is not integer
   * @property {Boolean} eventIsNeg - if the event ID is negative
   */
  state = {
    noRun: false,
    noEvent: false,
    repetitive: false,
    eventIsNotInt: false,
    eventIsNeg: false,
  };

  /**
   * Gets a waveform by dispatching a redux action
   * @param {String} runID The run ID
   * @param {Number} eventID The event ID
   */
  handleGetWaveform = (runID, eventID) => {
    const { user, currRunID, currEventID } = this.props;
    eventID = parseInt(eventID);
    if (runID && Number.isInteger(eventID)) {
      eventID = parseInt(eventID);
      if (runID === currRunID && eventID === currEventID)
        this.handleShowModalRep();
      else if (isNaN(eventID) || !Number.isInteger(eventID))
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

  /**
   * Close the no run error
   */
  handleCloseNoRun = () => this.setState({ noRun: false });

  /**
   * Shows the no run error
   */
  handleShowModalNoRun = () => this.setState({ noRun: true });

  /**
   * Close the no event error
   */
  handleCloseNoEvent = () => this.setState({ noEvent: false });

  /**
   * Shows the no event error
   */
  handleShowModalNoEvent = () => this.setState({ noEvent: true });

  /**
   * Close the no run and no event error
   */
  handleCloseNoRunNoEvent = () =>
    this.setState({ noRun: false, noEvent: false });

  /**
   * Shows the no run and no event error
   */
  handleShowModalNoRunNoEvent = () =>
    this.setState({ noRun: true, noEvent: true });

  /**
   * Closes the event ID is not integer error
   */
  handleCloseEventIsNotInt = () => this.setState({ eventIsNotInt: false });

  /**
   *  Shows the event ID is not integer error
   */
  handleShowModalEventIsNotInt = () => this.setState({ eventIsNotInt: true });

  /**
   * Closes the event ID is negative error
   */
  handleCloseEventIsNeg = () => this.setState({ eventIsNeg: false });

  /**
   *  Shows the event ID is negative error
   */
  handleShowModalEventIsNeg = () => this.setState({ eventIsNeg: true });

  /**
   * Closes the repeated waveform error
   */
  handleCloseRep = () => this.setState({ repetitive: false });

  /**
   * Shows the repeated waveform error
   */
  handleShowModalRep = () => this.setState({ repetitive: true });

  /**
   * renders the button
   */
  render() {
    const {
      noRun,
      noEvent,
      repetitive,
      eventIsNotInt,
      eventIsNeg,
    } = this.state;
    const { runID, eventID, currRunID, currEventID } = this.props;
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
            const previous = Number.isInteger(currEventID)
              ? parseInt(currEventID) - 1
              : "";
            this.handleGetWaveform(currRunID, previous.toString());
          }}
          active
          style={{ marginTop: "10px" }}
          disabled={!currRunID || !Number.isInteger(currEventID)}
        >
          Get Previous Event
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const next = Number.isInteger(currEventID)
              ? parseInt(currEventID) + 1
              : "";
            this.handleGetWaveform(currRunID, next.toString());
          }}
          active
          style={{ marginTop: "10px" }}
          disabled={!currRunID || !Number.isInteger(currEventID)}
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
  currRunID: state.waveform.runID,
  currEventID: state.waveform.eventID,
});

/**
 * Connects the component to redux store.
 * @type {Component}
 */
export default connect(mapStateToProps, null)(GetNewWaveform);
