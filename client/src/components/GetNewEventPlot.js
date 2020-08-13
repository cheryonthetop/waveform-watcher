import React, { Component } from "react";
import { getEventPlot } from "../actions/waveformActions";
import { Button } from "react-bootstrap";
import { connect } from "react-redux";
import ErrorModal from "./ErrorModal";

/**
 * A get event plots button
 */
class GetNewEventPlot extends Component {
  /**
   * @property {Boolean} if the sole error modal should be shown
   */
  state = {
    show: false,
  };

  /**
   * Gets the event plot (a script string) with redux action
   */
  handleGetEventPlot = () => {
    const { user, inputRunID } = this.props;

    if (inputRunID) {
      this.props.handleLoading();
      console.log(user, inputRunID);
      this.props.dispatch(getEventPlot(user, inputRunID));
    } else {
      this.handleShow();
    }
  };

  /**
   * Close the error modal
   */
  handleClose = () => this.setState({ show: false });

  /**
   * Shows the error modal
   */
  handleShow = () => this.setState({ show: true });

  /**
   * Renders the button
   */
  render() {
    const { show } = this.state;
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
        <ErrorModal
          title="Get New Event Plot Error"
          body="You need to enter a run ID to get a new Event Plot"
          show={show}
          handleClose={this.handleClose}
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
  user: state.auth.user,
  inputRunID: state.waveform.inputRunIDEventPage,
});

/**
 * Connects the component to redux store. This allows
 * the action to be accessed in the component
 * @type {Component}
 */
export default connect(mapStateToProps, null)(GetNewEventPlot);
