import React, { Component } from "react";
import "./stylesheets/waveform.css";
import { getWaveform } from "../actions/waveformActions";
import { connect } from "react-redux";
import CreatableSingle from "./CreatableSingle";
import { embed } from "@bokeh/bokehjs";

class Waveform extends Component {
  state = {
    user: "cheryonthetop",
    run_id: "170204_1710",
    bokeh_json: null,
    build_low_level: true,
    tag: "default tag",
    comments: "",
  };
  componentDidMount() {}

  componentDidUpdate() {
    if (
      this.state.bokeh_model !== this.props.bokeh_model &&
      this.props.bokeh_model !== null &&
      this.props.bokeh_model !== undefined
    ) {
      this.deleteWaveform();
      this.loadWaveform();
      this.state.bokeh_model = this.props.bokeh_model;
    }
  }

  deleteWaveform() {
    var container = document.getElementById("graph");
    if (container.hasChildNodes())
      document.getElementById("graph").removeChild(container.childNodes[0]);
  }

  loadWaveform() {
    embed.embed_item(this.props.bokeh_model, "graph");
  }

  handleGetWaveform = (user, run_id, build_low_level) => {
    console.log(user, run_id, build_low_level);
    this.props.dispatch(getWaveform(user, run_id, build_low_level));
  };

  render() {
    return (
      <div id="graph-container">
        <div id="param-box">
          <div id="param">
            <h3> Parameters </h3>
            <strong>Run ID: </strong>
            {/* <select type="text" style={{ width: "74%" }} /> */}
            <input
              defaultValue={this.state.run_id}
              onChange={(event) =>
                this.setState({
                  run_id: event.target.value,
                })
              }
            ></input>
            <br></br>
            <strong>Build low-level: </strong>
            <select
              type="text"
              style={{ width: "49%" }}
              defaultValue={true}
              onChange={(event) =>
                this.setState({
                  build_low_level: event.target.value,
                })
              }
            >
              <option value={true}>True</option>
              <option value={false}>False</option>
            </select>

            <div id="gw-div-old">
              <button
                onClick={() =>
                  this.handleGetWaveform(
                    this.state.user,
                    this.state.run_id,
                    this.state.build_low_level
                  )
                }
              >
                Get New Waveform
              </button>
            </div>

            <br></br>
            <div style={{ textAlign: "center", width: "100%" }}>
              <strong> ********OR********</strong>
            </div>

            <strong>Tag: </strong>
            <select
              type="text"
              style={{ width: "83%" }}
              onChange={(event) =>
                this.setState({
                  tag: event.target.value,
                })
              }
            >
              <option value={1}>One</option>
              <option value={2}>Two</option>
              <option value={3}>Three</option>
            </select>
            <div id="gw-div-new">
              <button>Get Saved Waveform</button>
            </div>
          </div>
        </div>

        <div id="graph-box">
          <h3> Waveform </h3>
          <div id="graph"></div>
          <div id="comment-box">
            <strong> Comments & Tags </strong>
            <br></br>
            {/* <input className="ct"></input> */}
            <CreatableSingle />
            <textarea className="ct" style={{ lineHeight: "100%" }}></textarea>
            <button>Save Waveform under tag {this.state.tag}</button>
          </div>
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
  // tags_comments: {},
  // tags_run_id: {},
});

export default connect(mapStateToProps, null)(Waveform);
