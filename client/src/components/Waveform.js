import React, { Component } from "react";
import "./stylesheets/waveform.css";
import { getWaveform, saveWaveform } from "../actions/waveformActions";
import { connect } from "react-redux";
import Tags from "./Tags";
import { embed } from "@bokeh/bokehjs";

class Waveform extends Component {
  state = {
    run_id: this.props.run_id,
    bokeh_model: this.props.bokeh_model,
    build_low_level: true,
    tag: "",
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

  handleStateChangeTag = (value) => {
    this.setState({ tag: value });
  };

  handleSave = () => {
    this.props.dispatch(
      saveWaveform(this.props.user, this.state.tag, this.state.comments)
    );
  };

  render() {
    return (
      <div id="graph-container">
        <div id="param-box">
          <div id="param">
            <h3> Control </h3>
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
                    this.props.user,
                    this.state.run_id,
                    this.state.build_low_level
                  )
                }
              >
                Get New Waveform
              </button>
            </div>

            <br></br>
            {/* <div style={{ textAlign: "center", width: "100%" }}>
              <strong> ********OR********</strong>
            </div> */}

            <div id="comment-box">
              <strong> Comments & Tags </strong>
              <br></br>
              {/* <input className="ct"></input> */}
              <Tags handleStateChangeTag={this.handleStateChangeTag} />
              <textarea
                className="ct"
                style={{ lineHeight: "100%", height: "200px" }}
                onChange={(event) =>
                  this.setState({
                    comments: event.target.value,
                  })
                }
              ></textarea>
              <button onClick={this.handleSave}>
                Save Waveform under tag {this.state.tag}
              </button>
            </div>
            {/* <div id="gw-div-new">
              <button>Get Saved Waveform</button>
            </div> */}
          </div>
        </div>

        <div id="graph-box">
          {/* <h3> Waveform </h3> */}
          <div id="graph"></div>
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
  tags_data: state.waveform.tags_data,
});

export default connect(mapStateToProps, null)(Waveform);
