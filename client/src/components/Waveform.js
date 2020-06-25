import React, { Component } from "react";
import "./stylesheets/waveform.css";
import { connect } from "react-redux";
import { embed } from "@bokeh/bokehjs";
import Loading from "react-loading-animation";
import Tags from "./Tags";
import Runs from "./Runs";
import GetNewWaveform from "./GetNewWaveform";
import Param from "./Param";

class Waveform extends Component {
  state = {
    run_id: this.props.run_id,
    bokeh_model: this.props.bokeh_model,
    build_low_level: true,
    isLoading: true,
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

  handleStateChangeBuildLevel = (value) => {
    this.setState({ build_low_level: value.label });
  };

  handleLoading = () => {
    this.setState({ isLoading: true });
  };

  render() {
    const { run_id, build_low_level, isLoading } = this.state;
    return (
      <div id="graph-container">
        <div id="control-box">
          <div id="control">
            <h3> Control </h3>
            <Runs
              handleStateChangeRunID={this.handleStateChangeRunID}
              handleStateChangeBuildLevel={this.handleStateChangeBuildLevel}
            />
            <GetNewWaveform
              run_id={run_id}
              build_low_level={build_low_level}
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
              build_low_level={this.props.build_low_level}
            ></Param>
            <div id="graph" />
          </Loading>
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
  build_low_level: state.waveform.build_low_level,
});

export default connect(mapStateToProps, null)(Waveform);
