import React, { Component } from "react";
import { connect } from "react-redux";
import Select from "react-select";

/**
 * Creates an option object. The label property is
 * necessary for react-select component
 * @param {String} label The label of the option
 * @type {Function}
 */
const createOption = (label) => ({
  label,
});

/**
 * The select box with all the available runs
 */
class Runs extends Component {
  /**
   * @property {Array} options - all the runs
   * @property {Boolean} options - if the app data is loaded
   */
  state = {
    options: [],
    dataLoaded: !this.props.isLoading,
    value: undefined,
  };

  /**
   * Tries loading available runs
   */
  componentDidMount() {
    this.tryLoadAvailableRuns();
  }

  /**
   * Tries loading available runs
   */
  componentDidUpdate() {
    this.tryLoadAvailableRuns();
  }

  /**
   * Loads available runs if there are any and not yet loaded
   */
  tryLoadAvailableRuns() {
    const { availableRuns } = this.props;
    const { options } = this.state;
    if (availableRuns.length !== 0 && options.length === 0) {
      const runs = availableRuns.map((run) => createOption(run));
      this.setState(
        {
          options: runs,
          dataLoaded: true,
        },
        () => {
          if (this.props.runID)
            this.setState({
              value: this.state.options.find(
                (option) => option.label === this.props.runID
              ),
            });
        }
      );
    }
  }

  /**
   * Changes the state in the parent page through props
   * @param {String} value the run selected
   * @param {Any} param1 the action and removed value
   */
  handleStateChangeRunID = (value, { action, removedValue }) => {
    switch (action) {
      case "select-option":
        this.setState(
          {
            value: value,
          },
          () => this.props.handleStateChangeRunID(value)
        );
    }
  };

  /**
   * Renders the select box
   */
  render() {
    const { options, dataLoaded, value } = this.state;
    return (
      <div>
        <strong>Run ID: </strong>
        <Select
          options={options}
          onChange={this.handleStateChangeRunID}
          isDisabled={!dataLoaded}
          isLoading={!dataLoaded}
          value={value}
        />
      </div>
    );
  }
}

/**
 * Maps the central state to props in this page
 * @param {Object} state The central state in redux store
 * @type {Function}
 */
const mapStateToProps = (state) => ({
  availableRuns: state.waveform.availableRuns,
  isLoading: state.waveform.isLoading,
});

/**
 * Connects the component to redux store.
 * @type {Component}
 */
export default connect(mapStateToProps, null)(Runs);
