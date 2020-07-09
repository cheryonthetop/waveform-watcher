import React, { Component } from "react";
import "../stylesheets/waveform.css";
import { connect } from "react-redux";
import { embed } from "@bokeh/bokehjs";
import Loading from "react-loading-animation";
import Tags from "../Tags";
import Runs from "../Runs";
import GetNewWaveform from "../GetNewWaveform";
import Param from "../Param";
import Events from "../Events";
import { Redirect } from "react-router-dom";
import Header from "../Header";

class Waveform extends Component {
  state = {
    run_id: this.props.run_id,
    bokeh_model: this.props.bokeh_model,
    event: "",
    isLoading: false,
  };

  componentDidUpdate() {
    if (
      this.state.bokeh_model !== this.props.bokeh_model &&
      this.props.bokeh_model
    ) {
      this.setState({ isLoading: false }, () => {
        this.deleteWaveform();
        this.loadWaveform();
        this.setState({ bokeh_model: this.props.bokeh_model });
      });
    }
  }

  deleteWaveform() {
    var container = document.getElementById("graph");
    while (container && container.hasChildNodes())
      container.removeChild(container.childNodes[0]);
  }

  loadWaveform() {
    console.log("loading waveform");
    this.deleteWaveform();
    if (this.state.bokeh_model !== this.props.bokeh_model)
      embed.embed_item(this.props.bokeh_model, "graph");
  }

  handleStateChangeRunID = (value) => {
    this.setState({ run_id: value.label });
  };

  handleStateChangeEvent = (value) => {
    this.setState({ event: value.label });
  };

  handleLoading = () => {
    this.setState({ isLoading: true });
  };

  render() {
    if (!this.props.isAuthenticated) {
      return <Redirect to="/login" />;
    }
    const { run_id, event, isLoading } = this.state;
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
                run_id={run_id}
                event={event}
                user={this.props.user}
                handleLoading={this.handleLoading}
              />
              <Tags />
            </div>
          </div>

          <div id="graph-box">
            <Loading isLoading={isLoading}>
              <Param
                run_id={this.props.run_id}
                event={this.props.event}
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
  run_id: state.waveform.run_id,
  bokeh_model: state.waveform.bokeh_model,
  event: state.waveform.event,
});

export default connect(mapStateToProps, null)(Waveform);
