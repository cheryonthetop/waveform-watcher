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
import WaveformHistory from "../WaveformHistory";
import GetShareLink from "../GetShareLink";

class Waveform extends Component {
  /**
   * @property {Number} runID - The run ID in the select box
   * @property {Object} waveform - the waveform on this page
   * @property {String} eventID - The event ID in the input box
   * @property {Boolean} isLoading - if the waveform is loading (spinning wheel)
   * @property {Boolean} waveformLoaded - if a waveform has been loaded
   * @property {Boolean} renderError - if there is a bokeh render error
   * @property {Boolean}  paramsHidden - if the parameters for the waveform
   *                                      should be hidden
   */
  state = {
    runID: this.props.runID,
    waveform: this.props.waveform,
    eventID: this.props.eventID,
    isLoading: this.props.isLoading,
    waveformLoaded: false,
    renderError: false,
    paramsHidden: true,
  };

  /**
   * Tries loading waveform if app data is loaded
   */
  componentDidMount() {
    if (!this.props.isLoading) {
      this.tryLoadWaveform();
    }
  }

  /**
   * Tries loading waveform if app data is loaded
   */
  componentDidUpdate() {
    if (!this.props.isLoading) {
      this.tryLoadWaveform();
    }
  }

  /**
   * Loads waveform if there is a new waveform, or if the user
   * browsed waveform last time it uses this app
   */
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
    const hasErrorWaveform =
      this.props.waveform === null && this.props.runID && this.props.eventID;
    if (hasErrorWaveform && isLoading) this.setState({ isLoading: false });
  }

  /**
   * Deletes waveforms in the page
   */
  deleteWaveform() {
    var container = document.getElementById("graph");
    while (container && document.getElementById("graph").hasChildNodes())
      container.removeChild(container.childNodes[0]);
  }

  /**
   * Loads the waveform with BokehJS API call embed
   */
  loadWaveform() {
    console.log("Loading Waveform...");
    try {
      embed.embed_item(this.props.waveform, "graph");
      this.setState({ waveform: this.props.waveform, paramsHidden: false });
    } catch {
      this.handleCloseModalRenderError();
      this.setState({ waveform: this.props.waveform });
    }
  }

  /**
   * Changes run ID when a user selects one
   * @param {Object} value The selected entry
   */
  handleStateChangeRunID = (value) => {
    this.setState({ runID: value.label });
  };

  /**
   * Changes event ID when a user inputs one
   * @param {String} value User input
   */
  handleStateChangeEvent = (value) => {
    console.log("Changing event ID to: ", value);
    this.setState({ eventID: value });
  };

  /**
   * Redirects the user to home page
   */
  handleViewEvents = () => {
    this.props.history.push("/");
  };

  /**
   * Triggers the spinning wheel and hides the parameters
   */
  handleLoading = () => {
    this.setState({ isLoading: true, paramsHidden: true });
  };

  /**
   * Shows the modal of waveform render error
   */
  handleShowModalRenderError = () => {
    this.setState({ renderError: true });
  };

  /**
   * Closes the modal of waveform render error
   */
  handleCloseModalRenderError = () => {
    this.setState({ renderError: false });
  };

  /**
   * Renders the page
   */
  render() {
    if (!this.props.isAuthenticated) {
      window.localStorage.setItem("redirect", this.props.location.pathname);
      return <Redirect to="/login" />;
    }
    const { runID, eventID, isLoading, renderError, paramsHidden } = this.state;
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
              <WaveformHistory handleLoading={this.handleLoading} />

              <Tags handleLoading={this.handleLoading} />
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
              <div id="param-box">
                <Param
                  runID={this.props.runID}
                  eventID={this.props.eventID}
                  waveform={this.props.waveform}
                  hidden={paramsHidden}
                ></Param>
                <GetShareLink hidden={paramsHidden} />
              </div>

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

/**
 * Maps the central state to props in this page
 * @param {Object} state The central state in redux store
 * @type {Function}
 */
const mapStateToProps = (state) => ({
  user: state.auth.user,
  isAuthenticated: state.auth.isAuthenticated,
  availableRuns: state.waveform.availableRuns,
  runID: state.waveform.runID,
  waveform: state.waveform.waveform,
  eventID: state.waveform.eventID,
  isLoading: state.waveform.isLoading,
});

/**
 * Connects the component to redux store. Exposes the component
 * to react router dom to allow redirecting through history
 * @type {Component}
 */
export default connect(mapStateToProps, null)(withRouter(Waveform));
