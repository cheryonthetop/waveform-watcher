import React, { Component } from "react";
import "./stylesheets/body.css";
import { connect } from "react-redux";
import { embed } from "@bokeh/bokehjs";
import Loading from "react-loading-animation";
import Runs from "./Runs";
import GetNewEventPlot from "./GetNewEventPlot";
import { Button } from "react-bootstrap";
import { withRouter } from "react-router";

class EventSelection extends Component {
  state = {
    runID: this.props.runID,
    eventPlot: this.props.eventPlot,
    isLoading: false,
  };

  componentDidUpdate() {
    this.tryLoadeventPlots();
  }

  tryLoadeventPlots() {
    if (this.state.eventPlot !== this.props.eventPlot && this.props.eventPlot) {
      this.setState({ isLoading: false }, () => {
        this.deleteEventPlots();
        this.loadeventPlots();
        this.setState({ eventPlot: this.props.eventPlot });
      });
    }
  }
  deleteEventPlots() {
    var container = document.getElementById("graph");
    while (container && container.hasChildNodes())
      container.removeChild(container.childNodes[0]);
  }

  loadeventPlots() {
    console.log("loading waveform");
    this.deleteEventPlots();
    if (this.state.eventPlot !== this.props.eventPlot)
      embed.embed_item(this.props.eventPlot, "graph");
  }

  handleStateChangeRunID = (value) => {
    this.setState({ runID: value.label });
  };

  handleLoading = () => {
    this.setState({ isLoading: true });
  };

  handleOnClickWaveform = () => {
    this.props.history.push("/waveform");
  };

  render() {
    const { runID, event, isLoading } = this.state;
    return (
      <div id="graph-container">
        <div id="control-box">
          <div id="control">
            <h3> Control </h3>
            <Runs handleStateChangeRunID={this.handleStateChangeRunID} />
            <GetNewEventPlot
              runID={runID}
              event={event}
              user={this.props.user}
              handleLoading={this.handleLoading}
            />
            <br />
            <Button onClick={this.handleOnClickWaveform} size="sm">
              Go to Waveform
            </Button>
          </div>
        </div>

        <div id="graph-box">
          <Loading isLoading={isLoading}>
            <div id="graph" />
          </Loading>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.waveform.user,
  runID: state.waveform.runID,
  eventPlot: state.waveform.eventPlot,
  event: state.waveform.event,
});

export default connect(mapStateToProps, null)(withRouter(EventSelection));
