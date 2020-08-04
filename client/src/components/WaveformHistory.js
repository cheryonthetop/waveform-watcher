import React, { Component } from "react";
import { getWaveform } from "../actions/waveformActions";
import { connect } from "react-redux";
import Select from "react-select";

/**
 * Creates a tag option
 * @param {String} label The displayed tag
 * @param {Object} data Has comments, run ID, waveform
 * @type {Function}
 */
const createOption = (label, data) => ({
  label,
  data: data,
});

/**
 * Empty array of options as default
 * @type {Array}
 */
const defaultOptions = [];

class WaveformHistory extends Component {
  /**
   * @property {Boolean} isLoading - if the tag is being created; for animation only
   * @property {Boolean} dataLoaded - if app data is loaded
   * @property {Array} options - tags
   * @property {Object} value - A selected option object from createOption
   */
  state = {
    isLoading: this.props.isLoading,
    dataLoaded: false,
    options: defaultOptions,
    value: undefined,
  };

  /**
   * Tries load options if the app data finishes loading
   * and options are not updated
   */
  componentDidMount() {
    if (!this.props.isLoading && !this.state.dataLoaded)
      this.setState({ dataLoaded: true }, () => this.loadOptions());
  }

  /**
   * Tries load options if the app data finishes loading
   * and options are not updated
   */
  componentDidUpdate() {
    if (!this.props.isLoading && !this.state.dataLoaded)
      this.setState({ dataLoaded: true }, () => this.loadOptions());
    if (this.props.waveformHistory !== this.state.options) this.loadOptions();
  }
  /**
   * Loads tags if there are any
   */
  loadOptions = () => {
    let newOptions = [];
    this.props.waveformHistory.map((waveform) =>
      newOptions.push(
        createOption(
          waveform.runID + " , " + waveform.eventID.toString(),
          waveform
        )
      )
    );
    console.log(newOptions);
    this.setState({ options: newOptions });
  };
  /**
   * Changes comments and switches waveform when a tag is selected
   * @param {Object} newValue new tag option from creatOption
   * @param {Object} actionMeta metadata of action
   */
  handleChangeSelect = (newValue, actionMeta) => {
    this.setState({ value: newValue });
    if (actionMeta.action === "select-option") {
      // Data comes from Mongo DB, hence the _ in variable name below
      const runID = newValue.data.run_id;
      const eventID = newValue.data.event_id;
      if (runID === this.props.runID && eventID === this.props.eventID)
        console.log("Same waveform. No need to switch");
      else if (runID && eventID) {
        console.log("Switching Waveform...");
        this.props.dispatch(getWaveform(this.props.user, runID, eventID));
        this.props.handleLoading();
      }
    }
  };

  render() {
    return (
      <div id="waveform-history">
        <strong> History </strong>

        <Select
          options={this.state.options}
          onChange={this.handleChangeSelect}
          isDisabled={!this.state.dataLoaded}
          isLoading={!this.state.dataLoaded}
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
  user: state.waveform.user,
  tagsData: state.waveform.tagsData,
  waveform: state.waveform.waveform,
  runID: state.waveform.runID,
  eventID: state.waveform.eventID,
  isLoading: state.waveform.isLoading,
  waveformHistory: state.waveform.waveformHistory,
});

/**
 * Connects the component to redux store.
 * @type {Component}
 */
export default connect(mapStateToProps, null)(WaveformHistory);
