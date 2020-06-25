import React, { Component } from "react";
import { connect } from "react-redux";
import Select from "react-select";

const createOption = (label) => ({
  label,
});

class Runs extends Component {
  state = {
    options: [],
  };

  componentDidUpdate() {
    const { available_runs } = this.props;
    const { options } = this.state;
    if (available_runs && options.length !== available_runs.length) {
      const runs = available_runs.map((run) => createOption(run));
      this.setState({ options: runs }, () => {
        console.log(this.state.options);
      });
    }
  }

  handleStateChangeRunID = (value, { action, removedValue }) => {
    switch (action) {
      case "select-option":
        this.props.handleStateChangeRunID(value);
    }
  };

  handleStateChangeBuildLevel = (value, { action, removedValue }) => {
    switch (action) {
      case "select-option":
        this.props.handleStateChangeBuildLevel(value);
    }
  };

  render() {
    return (
      <div>
        <strong>Run ID: </strong>
        <Select
          options={this.state.options}
          onChange={this.handleStateChangeRunID}
        />
        <br></br>
        <strong>Build low-level: </strong>
        <Select
          options={[{ label: "true" }, { label: "false" }]}
          onChange={this.handleStateChangeBuildLevel}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  available_runs: state.waveform.available_runs,
});

export default connect(mapStateToProps, null)(Runs);
