import React, { Component } from "react";
import "./stylesheets/body.css";
import { connect } from "react-redux";
import Loading from "react-loading-animation";
import Runs from "./Runs";
import GetNewEventPlot from "./GetNewEventPlot";
import { Button } from "react-bootstrap";
import { withRouter } from "react-router";

/**
 * The plots of all the events for users to choose from
 */
class EventSelection extends Component {
  /**
   * @property {String} The run ID
   * @property {String} A script tag that embeds the interactive plots
   * @property {Boolean} If the script tag is being loaded
   */
  state = {
    runID: this.props.runID,
    eventPlot: undefined,
    isLoading: false,
  };

  /**
   * Tries loading the plots
   */
  componentDidMount() {
    this.tryLoadEventPlots();
  }

  /**
   * Tries loading the plots
   */
  componentDidUpdate() {
    this.tryLoadEventPlots();
  }

  /**
   * Loads the plots if there is a new script tag not
   * loaded into this page's state
   */
  tryLoadEventPlots() {
    const { eventPlot } = this.state;
    const hasNewEventPlots =
      this.props.eventPlot && eventPlot !== this.props.eventPlot;
    if (hasNewEventPlots) {
      this.setState({ isLoading: false }, () => {
        this.deleteEventPlots();
        this.loadEventPlots();
        this.setState({ eventPlot: this.props.eventPlot }, () => {
          this.reloadScript();
        });
      });
    }
  }

  /**
   * Reloads the script to ensure script is executed after the script tag
   * is inserted
   */
  reloadScript = () => {
    const ignored = document
      .createRange()
      .createContextualFragment(this.state.eventPlot);
  };

  /**
   * Deletes the event plots if there are any before loading
   */
  deleteEventPlots() {
    var container = document.getElementById("graph");
    while (container && container.hasChildNodes())
      container.removeChild(container.childNodes[0]);
  }

  /**
   * Load the events plots by creating a node tag from the script string
   * and append the node to the specified div tag
   */
  loadEventPlots() {
    console.log("loading events...");
    const scriptStr = this.props.eventPlot;
    const parent = document.getElementById("graph");
    const scriptTag = document
      .createRange()
      .createContextualFragment(scriptStr);
    parent.appendChild(scriptTag);
    var tempDate = new Date();
    var date =
      tempDate.getFullYear() +
      "-" +
      (tempDate.getMonth() + 1) +
      "-" +
      tempDate.getDate() +
      " " +
      tempDate.getHours() +
      ":" +
      tempDate.getMinutes() +
      ":" +
      tempDate.getSeconds();
    console.log("Events loaded at ", date);
  }

  /**
   * Changes run ID when a user selects one
   * @param {Object} value The selected entry
   */
  handleStateChangeRunID = (value) => {
    this.setState({ runID: value.label });
  };

  /**
   * Starts the spinning wheel
   */
  handleLoading = () => {
    this.setState({ isLoading: true });
  };

  /**
   * Redirects the user to the waveform page
   */
  handleOnClickWaveform = () => {
    this.props.history.push("/waveform");
  };

  /**
   * Renders the page
   */
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

/**
 * Maps the central state to props in this page
 * @param {Object} state The central state in redux store
 * @type {Function}
 */
const mapStateToProps = (state) => ({
  user: state.waveform.user,
  runID: state.waveform.runID,
  eventPlot: state.waveform.eventPlot,
});

/**
 * Connects the component to redux store. Exposes the component
 * to react router dom to allow redirecting through history
 * @type {Component}
 */
export default connect(mapStateToProps, null)(withRouter(EventSelection));
