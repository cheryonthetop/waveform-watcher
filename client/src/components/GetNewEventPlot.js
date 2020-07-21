import React, { Component } from "react";
import { getEventPlot } from "../actions/waveformActions";
import { Button } from "react-bootstrap";
import { connect } from "react-redux";
import ErrorModal from "./ErrorModal";

class GetNewEventPlot extends Component {
  state = {
    show: false,
  };

  handleGetEventPlot = () => {
    const { user, runID } = this.props;

    if (true) {
      this.props.handleLoading();
      console.log(user, runID);
      // this.props.dispatch(getEventPlot(user, runID));
    } else {
      this.handleShow();
    }
  };

  handleClose = () => this.setState({ show: false });

  handleShow = () => this.setState({ show: true });

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

export default connect(null, null)(GetNewEventPlot);
