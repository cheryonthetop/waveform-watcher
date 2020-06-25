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
