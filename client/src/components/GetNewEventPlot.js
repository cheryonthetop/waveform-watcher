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
    const { user, runID } = this.props;

    if (runID) {
      this.props.handleLoading();
      console.log(user, runID);
      this.props.dispatch(getEventPlot(user, runID));
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
 * Connects the component to redux store. This allows
 * the action to be accessed in the component
 * @type {Component}
 */
export default connect(null, null)(GetNewEventPlot);
