import React, { Component } from "react";
import "./stylesheets/waveform.css";
import { connect } from "react-redux";
import { embed } from "@bokeh/bokehjs";
import Loading from "react-loading-animation";
import Runs from "./Runs";
import GetNewEventPlot from "./GetNewEventPlot";
import { Button } from "react-bootstrap";
import { withRouter } from "react-router";

class EventSelection extends Component {
  state = {
    run_id: this.props.run_id,
    event_plot: this.props.event_plot,
    isLoading: false,
  };

  componentDidUpdate() {
    if (
      this.state.event_plot !== this.props.event_plot &&
      this.props.event_plot
    ) {
      this.setState({ isLoading: false }, () => {
        this.deleteEventPlots();
        this.loadEventPlots();
        this.setState({ event_plot: this.props.event_plot });
      });
    }
  }

  deleteEventPlots() {
    var container = document.getElementById("graph");
    while (container && container.hasChildNodes())
      container.removeChild(container.childNodes[0]);
  }

  loadEventPlots() {
    console.log("loading waveform");
    this.deleteEventPlots();
    if (this.state.event_plot !== this.props.event_plot)
      embed.embed_item(this.props.event_plot, "graph");
  }

  handleStateChangeRunID = (value) => {
    this.setState({ run_id: value.label });
  };

  handleLoading = () => {
    this.setState({ isLoading: true });
  };

  handleOnClickWaveform = () => {
    this.props.history.push("/waveform");
  };

  render() {
    const { run_id, event, isLoading } = this.state;
    return (
      <div id="graph-container">
        <div id="control-box">
          <div id="control">
            <h3> Control </h3>
            <Runs handleStateChangeRunID={this.handleStateChangeRunID} />
            <GetNewEventPlot
              run_id={run_id}
              event={event}
              user={this.props.user}
              handleLoading={this.handleLoading}
            />
            <br />
            <Button onClick={this.handleOnClickWaveform} size="sm">
              Go to waveform{" "}
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
  run_id: state.waveform.run_id,
  event_plot: state.waveform.event_plot,
  event: state.waveform.event,
});

export default connect(mapStateToProps, null)(withRouter(EventSelection));
