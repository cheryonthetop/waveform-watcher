import React, { Component } from "react";
import "../stylesheets/body.css";
import { connect } from "react-redux";
import { embed } from "@bokeh/bokehjs";
import Loading from "react-loading-animation";
import Tags from "../Tags";
import Runs from "../Runs";
import GetNewWaveform from "../GetNewWaveform";
import Param from "../Param";
import Events from "../Events";
import { Redirect } from "react-router-dom";
import { Button } from "react-bootstrap";
import { withRouter } from "react-router-dom";
import ErrorModal from "../ErrorModal";
import Header from "../Header";

class Waveform extends Component {
  state = {
    runID: this.props.runID,
    waveform: this.props.waveform,
    eventID: this.props.eventID,
    isLoading: this.props.isLoading,
    waveformLoaded: false,
    renderError: false,
  };

  componentDidMount() {
    if (!this.props.isLoading) {
      this.tryLoadWaveform();
    }
  }

  componentDidUpdate() {
    if (!this.props.isLoading) {
      this.tryLoadWaveform();
    }
  }

  tryLoadWaveform() {
    const { waveform, waveformLoaded, isLoading } = this.state;
    const hasOldWaveform = waveform && waveform !== undefined;
    const hasNewWaveform =
      this.props.waveform && waveform !== this.props.waveform;
    if ((hasNewWaveform && isLoading) || (!waveformLoaded && hasOldWaveform)) {
      console.log("Tries loading...");
      this.setState({ isLoading: false, waveformLoaded: true }, () => {
        this.deleteWaveform();
        this.loadWaveform();
      });
    }
  }

  deleteWaveform() {
    var container = document.getElementById("graph");
    while (container && document.getElementById("graph").hasChildNodes())
      container.removeChild(container.childNodes[0]);
  }

  loadWaveform() {
    console.log("Loading Waveform...");
    try {
      embed.embed_item(this.props.waveform, "graph");
      this.setState({ waveform: this.props.waveform });
    } catch {
      this.handleCloseModalRenderError();
      this.setState({ waveform: undefined });
    }
  }

  handleStateChangeRunID = (value) => {
    this.setState({ runID: value.label });
  };

  handleStateChangeEvent = (value) => {
    console.log("Changing event ID to: ", value);
    this.setState({ eventID: value });
  };

  handleViewEvents = () => {
    this.props.history.push("/");
  };

  handleLoading = () => {
    this.setState({ isLoading: true });
  };

  handleShowModalRenderError = () => {
    this.setState({ renderError: true });
  };

  handleCloseModalRenderError = () => {
    this.setState({ renderError: false });
  };

  render() {
    if (!this.props.isAuthenticated) {
      window.localStorage.setItem("redirect", this.props.location.pathname);
      return <Redirect to="/login" />;
    }
    const { runID, eventID, isLoading, renderError } = this.state;
    return (
      <div>
        <Header />
        <div id="graph-container">
          <div id="control-box">
            <div id="control">
              <h3> Control </h3>
              <Runs handleStateChangeRunID={this.handleStateChangeRunID} />
              <br />
              <Events handleStateChangeEvent={this.handleStateChangeEvent} />
              <GetNewWaveform
                runID={runID}
                eventID={eventID}
                user={this.props.user}
                handleLoading={this.handleLoading}
              />
              <Tags />
            </div>
            <Button
              id="btn-view-events"
              size="sm"
              onClick={this.handleViewEvents}
            >
              Go Back to View Events{" "}
            </Button>
          </div>

          <div id="graph-box">
            <Loading isLoading={isLoading}>
              <Param
                runID={this.props.runID}
                eventID={this.props.eventID}
                waveform={this.props.waveform}
              ></Param>
              <div id="graph" />
            </Loading>
          </div>
        </div>
        <ErrorModal
          title="Render Waveform Error"
          body={"An Error Occured While Rendering the Waveform"}
          show={renderError}
          handleClose={this.handleCloseModalRenderError}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth.user,
  isAuthenticated: state.auth.isAuthenticated,
  availableRuns: state.waveform.availableRuns,
  runID: state.waveform.runID,
  waveform: state.waveform.waveform,
  eventID: state.waveform.eventID,
  isLoading: state.waveform.isLoading,
  error: state.error.error,
  msg: state.error.msg,
});

export default connect(mapStateToProps, null)(withRouter(Waveform));
