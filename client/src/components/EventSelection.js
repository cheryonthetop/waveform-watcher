import React, { Component } from "react";
import "./stylesheets/body.css";
import { connect } from "react-redux";
import { embed } from "@bokeh/bokehjs";
import Loading from "react-loading-animation";
import Runs from "./Runs";
import GetNewEventPlot from "./GetNewEventPlot";
import { Button } from "react-bootstrap";
import { withRouter } from "react-router";
import axios from "axios";

class EventSelection extends Component {
  state = {
    runID: this.props.runID,
    eventPlot: "",
    isLoading: false,
  };

  componentDidUpdate() {
    // this.tryLoadeventPlots();
  }

  // tryLoadeventPlots() {
  //   if (this.state.eventPlot !== this.props.eventPlot && this.props.eventPlot) {
  //     this.setState({ isLoading: false }, () => {
  //       this.deleteEventPlots();
  //       this.loadeventPlots();
  //       this.setState({ eventPlot: this.props.eventPlot });
  //     });
  //   }
  // }
  deleteEventPlots() {
    var container = document.getElementById("graph");
    while (container && container.hasChildNodes())
      container.removeChild(container.childNodes[0]);
  }

  // loadeventPlots() {
  //   console.log("loading waveform");
  //   this.deleteEventPlots();
  //   if (this.state.eventPlot !== this.props.eventPlot)
  //     embed.embed_item(this.props.eventPlot, "graph");
  // }

  handleStateChangeRunID = (value) => {
    this.setState({ runID: value.label });
  };

  handleLoading = () => {
    const self = this;
    this.setState({ isLoading: true }, () => {
      // Headers
      const config = {
        headers: {
          "Content-Type": "application/json",
          withCredentials: true,
        },
      };

      // Request body
      const body = JSON.stringify({
        user: "cheryonthetop",
        run_id: "170204_1710",
      });

      axios
        .post(`${process.env.REACT_APP_FLASK_BACKEND_URL}/api/ge`, body, config)
        .then(function (res) {
          console.log(res.data);
          self.setState({ isLoading: false }, () => {
            const node = document
              .createRange()
              .createContextualFragment(res.data);
            self.deleteEventPlots();
            document.getElementById("graph").appendChild(node);
          });
        })
        .catch((err) => console.log(err));
    });
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
