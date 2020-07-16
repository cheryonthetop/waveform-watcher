import React, { Component } from "react";
import { connect } from "react-redux";
import Select from "react-select";

const createOption = (label) => ({
  label,
});

class Runs extends Component {
  state = {
    options: [],
    dataLoaded: !this.props.isLoading,
  };

  componentDidMount() {
    this.loadAvailableRuns();
  }

  componentDidUpdate() {
    this.loadAvailableRuns();
  }

  loadAvailableRuns() {
    const { availableRuns } = this.props;
    const { options } = this.state;
    // console.log("available runs: " + availableRuns);
    // console.log("data loaded is " + dataLoaded);
    // console.log("options are " + options);
    if (availableRuns.length !== 0 && options.length === 0) {
      const runs = availableRuns.map((run) => createOption(run));
      this.setState({ options: runs, dataLoaded: true }, () => {
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

  render() {
    return (
      <div>
        <strong>Run ID: </strong>
        <Select
          options={this.state.options}
          onChange={this.handleStateChangeRunID}
          isDisabled={!this.state.dataLoaded}
          isLoading={!this.state.dataLoaded}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  availableRuns: state.waveform.availableRuns,
  isLoading: state.waveform.isLoading,
});

export default connect(mapStateToProps, null)(Runs);
