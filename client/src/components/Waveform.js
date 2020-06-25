import React, { Component } from "react";
import "./stylesheets/waveform.css";
import { getWaveform } from "../actions/waveformActions";
import { connect } from "react-redux";
import { embed } from "@bokeh/bokehjs";
import Loading from "react-loading-animation";
import Select from "react-select";
import { Button } from "react-bootstrap";
import Tags from "./Tags";
import Runs from "./Runs";

class Waveform extends Component {
  state = {
    run_id: this.props.run_id,
    bokeh_model: this.props.bokeh_model,
    build_low_level: true,
    isLoading: true,
  };
  componentDidMount() {}

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
    if (this.state.bokeh_model !== this.props.bokeh_model)
      embed.embed_item(this.props.bokeh_model, "graph");
  }

  handleGetWaveform = (user, run_id, build_low_level) => {
    this.deleteWaveform();
    this.setState({ isLoading: true });
    console.log(user, run_id, build_low_level);
    this.props.dispatch(getWaveform(user, run_id, build_low_level));
  };

  render() {
    return (
      <div id="graph-container">
        <div id="control-box">
          <div id="control">
            <h3> Control </h3>
            <Runs />
            <strong>Build low-level: </strong>
            <Select
              options={[{ label: "true" }, { label: "false" }]}
              onChange={(event) =>
                this.setState({
                  build_low_level: event.target.value,
                })
              }
            />

            <div id="gw-div-old" style={{ marginTop: "10px" }}>
              <Button
                variant="secondary"
                size="lg"
                onClick={() =>
                  this.handleGetWaveform(
                    this.props.user,
                    this.state.run_id,
                    this.state.build_low_level
                  )
                }
                active
              >
                Get New Waveform
              </Button>
            </div>
            <br></br>
            <div id="comment-box">
              <strong> Comments & Tags </strong>
              <br></br>
              <Tags />
            </div>
          </div>
        </div>

        <div id="graph-box">
          <Loading isLoading={this.state.isLoading}>
            <div id="param">
              <strong>Run ID: </strong>
              <input value={this.props.run_id} contentEditable={false}></input>
              <strong style={{ marginLeft: "10px" }}>Build Low Level: </strong>
              <input
                value={this.props.build_low_level}
                contentEditable={false}
              ></input>
            </div>
            <div id="graph"></div>
          </Loading>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth.user,
  isAuthenticated: state.auth.isAuthenticated,
  run_id: state.waveform.run_id,
  bokeh_model: state.waveform.bokeh_model,
  build_low_level: state.waveform.build_low_level,
});

export default connect(mapStateToProps, null)(Waveform);
