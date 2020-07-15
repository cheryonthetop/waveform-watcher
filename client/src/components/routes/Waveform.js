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
import Header from "../Header";

class Waveform extends Component {
  state = {
    runID: this.props.runID,
    waveform: this.props.waveform,
    eventID: this.props.eventID,
    isLoading: this.props.isLoading,
    waveformLoaded: false,
  };

  componentDidMount() {
    this.tryLoadWaveform();
  }

  componentDidUpdate() {
    this.tryLoadWaveform();
  }

  tryLoadWaveform() {
    const { waveform, waveformLoaded, isLoading } = this.state;
    const hasOldWaveform = waveform && waveform !== undefined;
    const hasNewWaveform =
      this.props.waveform && waveform !== this.props.waveform;
    if ((hasNewWaveform && isLoading) || (!waveformLoaded && hasOldWaveform)) {
      console.log("Tries loading");
      this.setState({ isLoading: false, waveformLoaded: true }, () => {
        this.loadWaveform();
        this.setState({ waveform: this.props.waveform });
      });
    }
  }

  deleteWaveform() {
    var container = document.getElementById("graph");
    while (container && document.getElementById("graph").hasChildNodes())
      container.removeChild(container.childNodes[0]);
  }

  loadWaveform() {
    console.log("loading waveform");
    this.deleteWaveform();
    embed.embed_item(this.props.waveform, "graph");
  }

  handleStateChangeRunID = (value) => {
    this.setState({ runID: value.label });
  };

  handleStateChangeEvent = (value) => {
    console.log("Changing event ID to: ", value.label);
    this.setState({ eventID: value.label });
  };

  handleViewEvents = () => {
    this.props.history.push("/");
  };

  handleLoading = () => {
    this.setState({ isLoading: true });
  };

  render() {
    if (!this.props.isAuthenticated) {
      return <Redirect to="/login" />;
    }
    const { runID, eventID, isLoading } = this.state;
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
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.waveform.user,
  isAuthenticated: state.auth.isAuthenticated,
  runID: state.waveform.runID,
  waveform: state.waveform.waveform,
  eventID: state.waveform.eventID,
  isLoading: state.waveform.isLoading,
  error: state.error.error,
  msg: state.error.msg,
});

export default connect(mapStateToProps, null)(withRouter(Waveform));
