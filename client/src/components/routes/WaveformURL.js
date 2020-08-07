import React, { Component } from "react";
import "../stylesheets/body.css";
import { connect } from "react-redux";
import { embed } from "@bokeh/bokehjs";
import Loading from "react-loading-animation";
import Tags from "../Tags";
import { Redirect } from "react-router-dom";
import { Button } from "react-bootstrap";
import { withRouter } from "react-router-dom";
import Header from "../Header";
import axios from "axios";
import { errorReported } from "../../actions/errorActions";
import ErrorModal from "../ErrorModal";
import {
  GET_WAVEFORM_SUCCESS,
  GETTING_WAVEFORM,
  GET_WAVEFORM_FAILURE,
} from "../../actions/types";

class WaveformURL extends Component {
  /**
   * @property {Boolean} isLoading - if the user app data is loaded
   * @property {Boolean} runNA - if the run is not available
   * @property {Boolean} isNotInt - if the event ID is not integer
   * @property {Boolean} waveformLoaded - if a waveform has been loaded
   * @property {Boolean} renderError - if there is a rendering error
   * @property {Boolean} eventIsNeg - if the event ID is negative
   */
  state = {
    isLoading: true,
    runNA: false,
    isNotInt: false,
    waveformLoaded: false,
    renderError: false,
    eventIsNeg: false,
  };

  /**
   * Tries to load waveform
   */
  componentDidMount() {
    if (!this.state.waveformLoaded && !this.props.isLoading)
      this.tryLoadWaveformFromURL();
  }

  /**
   * Tries to load waveform
   */
  componentDidUpdate() {
    if (!this.state.waveformLoaded && !this.props.isLoading)
      this.tryLoadWaveformFromURL();
  }

  /**
   * Loads waveform if the url parameters are valid
   */
  tryLoadWaveformFromURL() {
    const {
      user,
      availableRuns,
      match: {
        params: { run, event },
      },
    } = this.props;
    console.log("URL Params:", run, event);
    // We want to try load waveform once and only once
    // for the purpose of this page
    this.setState({ waveformLoaded: true }, () => {
      const eventInt = parseInt(event);
      if (!run || !event) return;
      else if (!availableRuns.find((element) => element === run))
        this.handleShowModalRunNotAvailable();
      else if (isNaN(eventInt) || !Number.isInteger(eventInt))
        this.handleShowModalIsNotInt();
      else if (event < 0) this.handleShowModalEventIsNeg();
      else this.loadWaveform(user, run, eventInt);
    });
  }

  /**
   * Loads the waveform directly into this page with an API
   * request to the flask server
   * @param {String} user The username
   * @param {String} run The run ID
   * @param {Number} event The event ID
   */
  loadWaveform = (user, run, event) => {
    const self = this;
    self.props.dispatch({
      type: GETTING_WAVEFORM,
      payload: { runID: run, eventID: event },
    });
    // Headers
    const config = {
      headers: {
        "Content-Type": "application/json",
        withCredentials: true,
      },
    };

    // Request body
    const body = JSON.stringify({
      user: user,
      run_id: run,
      event_id: event,
    });

    const url = `${
      process.env.REACT_APP_FLASK_BACKEND_URL
    }/api/gw?token=${window.localStorage.getItem("token")}`;

    axios
      .post(url, body, config)
      .then(function (res) {
        console.log(res.data);
        self.setState({ isLoading: false }, () => {
          if (res.data.err_msg) {
            const title = "Get Waveform Failure";
            self.props.dispatch(errorReported(title, res.data.err_msg));
          } else {
            try {
              embed.embed_item(res.data, "graph");
              self.props.dispatch({
                type: GET_WAVEFORM_SUCCESS,
                payload: { waveform: res.data },
              });
            } catch {
              self.handleShowModalRenderError();
              self.props.dispatch({ type: GET_WAVEFORM_FAILURE });
            }
          }
        });
      })
      .catch((err) => {
        console.log(err);
        self.props.dispatch({ type: GET_WAVEFORM_FAILURE });
      });
  };

  /**
   * Shows the not integer error
   */
  handleShowModalIsNotInt = () => {
    this.setState({ isNotInt: true });
  };

  /**
   * Closes the not integer error
   */
  handleCloseModalIsNotInt = () => {
    this.setState({ isNotInt: false });
  };

  /**
   * Shows the run not available error
   */
  handleShowModalRunNotAvailable = () => {
    this.setState({ runNA: true });
  };

  /**
   * Closes the run not available error
   */
  handleCloseModalRunNotAvailable = () => {
    this.setState({ runNA: false });
  };

  /**
   * Shows the render error
   */
  handleShowModalRenderError = () => {
    this.setState({ renderError: true });
  };

  /**
   * Closes the render error
   */
  handleCloseModalRenderError = () => {
    this.setState({ renderError: false });
  };

  /**
   * Shows the event is negative error
   */
  handleShowModalEventIsNeg = () => this.setState({ eventIsNeg: true });

  /**
   * Closes the event is negative error
   */
  handleCloseEventIsNeg = () => this.setState({ eventIsNeg: false });

  /**
   * Redirects the user to the home page
   */
  handleViewEvents = () => {
    this.props.history.push("/");
  };

  /**
   * Redirects the user to the waveform page
   */
  handleViewWaveform = () => {
    this.props.history.push("/waveform");
  };

  /**
   * Renders the page
   */
  render() {
    if (!this.props.isAuthenticated) {
      window.localStorage.setItem("redirect", this.props.location.pathname);
      return <Redirect to="/login" />;
    }
    const { isLoading, runNA, isNotInt, renderError, eventIsNeg } = this.state;
    return (
      <div>
        <Header />
        <div id="graph-container">
          <div id="control-box">
            <Tags />
            <br />
            <Button size="sm" onClick={this.handleViewEvents}>
              Go to View Events{" "}
            </Button>
            <Button
              size="sm"
              onClick={this.handleViewWaveform}
              style={{ marginTop: "10px" }}
            >
              Go to Waveform{" "}
            </Button>
          </div>

          <div id="graph-box">
            <Loading isLoading={isLoading}>
              <div id="graph" />
            </Loading>
          </div>
        </div>
        <ErrorModal
          title="URL Params Error"
          body={"The Run " + this.props.match.params.run + " Is Not Available"}
          show={runNA}
          handleClose={this.handleCloseModalRunNotAvailable}
        />
        <ErrorModal
          title="URL Params Error"
          body={
            "The Event " + this.props.match.params.event + " Is Not an Integer"
          }
          show={isNotInt}
          handleClose={this.handleCloseModalIsNotInt}
        />
        <ErrorModal
          show={eventIsNeg}
          handleClose={this.handleCloseEventIsNeg}
          title="Input Error"
          body="Event ID Must Not Be Negative"
        />

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
export default connect(mapStateToProps, null)(withRouter(WaveformURL));
