import React, { Component } from "react";
import "../stylesheets/body.css";
import { connect } from "react-redux";
import { embed } from "@bokeh/bokehjs";
import Loading from "react-loading-animation";
import Tags from "../Tags";
import Param from "../Param";
import { Redirect } from "react-router-dom";
import { Button } from "react-bootstrap";
import { withRouter } from "react-router-dom";
import Header from "../Header";
import axios from "axios";
import { errorReported } from "../../actions/errorActions";
import ErrorModal from "../ErrorModal";

class WaveformURL extends Component {
  state = {
    isLoading: true,
    runNA: false,
    isNotInt: false,
    waveformLoaded: false,
  };

  componentDidMount() {
    if (!this.state.waveformLoaded && !this.props.isLoading)
      this.tryLoadWaveformFromURL();
  }

  componentDidUpdate() {
    if (!this.state.waveformLoaded && !this.props.isLoading)
      this.tryLoadWaveformFromURL();
  }

  tryLoadWaveformFromURL() {
    const {
      user,
      availableRuns,
      match: {
        params: { run, event },
      },
    } = this.props;
    console.log("URL Params:", run, event);
    if (!run || !event) return;
    else if (!availableRuns.find((element) => element == run))
      this.handleShowModalRunNotAvailable();
    else if (!Number.isInteger(parseInt(event))) this.handleShowModalIsNotInt();
    else this.loadWaveform(user, run, event);
  }

  loadWaveform = (user, run, event) => {
    this.setState({ waveformLoaded: true }, () => {
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
          if (res.data.err_msg)
            this.props.dispatch(errorReported(res.data.err_msg));
          else embed.embed_item(res.data, "graph");
        })
        .catch((err) => {
          console.log(err);
        });
    });
  };

  handleShowModalIsNotInt = () => {
    this.setState({ isNotInt: true });
  };

  handleCloseModalIsNotInt = () => {
    this.setState({ isNotInt: false });
  };

  handleShowModalRunNotAvailable = () => {
    this.setState({ runNA: true });
  };

  handleCloseModalRunNotAvailable = () => {
    this.setState({ runNA: false });
  };

  render() {
    if (!this.props.isAuthenticated) {
      window.localStorage.setItem("redirect", this.props.location.pathname);
      return <Redirect to="/login" />;
    }
    const { isLoading, runNA, isNotInt } = this.state;
    return (
      <div>
        <Header />
        <div id="graph-container">
          <div id="control-box">
            <div id="control">
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

export default connect(mapStateToProps, null)(withRouter(WaveformURL));
