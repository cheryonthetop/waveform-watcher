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

  componentWillReceiveProps() {
    const options = this.props.available_runs.map((run) => createOption(run));
    this.setState({ options: options });
  }

  render() {
    return (
      <div>
        <strong>Run ID: </strong>
        <Select options={this.state.options} />
        <br></br>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  available_runs: state.waveform.available_runs,
});

export default connect(mapStateToProps, null)(Runs);
