import React, { Component } from "react";
import { connect } from "react-redux";
import {
  saveWaveform,
  deleteWaveform,
  getWaveform,
} from "../actions/waveformActions";
import { Button } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import ErrorModal from "./ErrorModal";

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

/**
 * The tag and comment box
 */
class Tags extends Component {
  /**
   * @property {Boolean} isLoading - if the tag is being created; for animation only
   * @property {Boolean} dataLoaded - if app data is loaded
   * @property {Boolean} noTag - if there is no tag supplied
   * @property {Boolean} noWaveform - if there is no waveform supplied
   * @property {Boolean} noAnything - if there is no tag or waveform supplied
   * @property {Boolean} saveSuccess - if saving operation succeeded
   * @property {Array} options - tags
   * @property {Object} value - A selected option object from createOption
   * @property {String} comments - The displayed comments
   */
  state = {
    isLoading: this.props.isLoading,
    dataLoaded: false,
    noTag: false,
    noWaveform: false,
    noAnything: false,
    saveSuccess: false,
    options: defaultOptions,
    value: undefined,
    comments: " ",
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
  }
  /**
   * Loads tags if there are any
   */
  loadOptions = () => {
    let newOptions = [];
    this.props.tagsData.map((tag_data) =>
      Object.entries(tag_data).map(([tag, data]) =>
        newOptions.push(createOption(tag, data))
      )
    );
    console.log(newOptions);
    this.setState({ options: newOptions }, () => {
      console.log("state is now:", this.state.options);
    });
  };
  /**
   * Changes comments and switches waveform when a tag is selected
   * @param {Object} newValue new tag option from creatOption
   * @param {Object} actionMeta metadata of action
   */
  handleChangeSelect = (newValue, actionMeta) => {
    console.group("Value Changed");
    console.log(newValue);
    console.log(`action: ${actionMeta.action}`);
    console.groupEnd();
    this.setState({ value: newValue });
    if (actionMeta.action === "select-option") {
      this.setState({ comments: newValue.data.comments });
      // Data comes from Mongo DB, hence the _ in variable name below
      const { run_id, event_id } = newValue.data;
      if (run_id === this.props.runID && event_id === this.props.eventID)
        console.log("Same waveform. No need to switch");
      else if (run_id && event_id) {
        console.log("Switching Waveform...");
        this.props.dispatch(getWaveform(this.props.user, run_id, event_id));
        this.props.handleLoading();
      }
    }
  };

  /**
   * Updates the comments and options state
   * @param {Object} event The event triggered with user input
   */
  handleChangeTextArea = (event) => {
    const { value, options } = this.state;
    if (value) {
      const newComments = event.target.value;
      const data = value.data;
      this.setState({
        comments: newComments,
        value: value
          ? { ...value, data: { ...data, comments: newComments } }
          : value,
        options: options.map((option) =>
          value && option.label === value.label
            ? { ...option, data: { ...data, comments: newComments } }
            : option
        ),
      });
      console.log("onchange comments");
    } else {
      this.setState({ comments: event.target.value });
    }
  };

  /**
   * Creates a new tag option
   * @param {String} inputValue new tag
   */
  handleCreateOption = (inputValue) => {
    this.setState({ isLoading: true });
    console.group("Option created");
    setTimeout(() => {
      const { options } = this.state;
      const newOption = createOption(inputValue, { comments: " " });
      console.log(newOption);
      console.groupEnd();
      this.setState({
        isLoading: false,
        options: [...options, newOption],
        value: newOption,
        comments: " ",
      });
    }, 1000);
  };

  /**
   * Saves a tag with the comments and waveform by
   * dispatching to a redux action
   */
  handleSave = () => {
    const { value, options } = this.state;
    const { user, runID, eventID, waveform } = this.props;
    if (value && waveform) {
      const tag = value.label;
      const comments = value.data.comments;
      this.props.dispatch(saveWaveform(user, tag, comments, runID, eventID));
      const newOptions = options.map((option) => {
        if (option.label === value.label) {
          return {
            ...value,
            data: { ...value.data, run_id: runID, event_id: eventID },
          };
        } else {
          return option;
        }
      });
      this.setState({ options: newOptions, saveSuccess: true }, () =>
        setTimeout(() => this.setState({ saveSuccess: false }), 1000)
      );
    } else {
      if (!value && !waveform) this.handleShowModalNoAnything();
      else if (!waveform) this.handleShowModalNoWaveform();
      else this.handleShowModalNoTag();
    }
  };

  /**
   * Deletes a tag by dispatching to a redux action
   */
  handleDelete = () => {
    const { value, options } = this.state;
    const { user } = this.props;

    const tag = value.label;
    const newOptions = options.filter((option) => option.label !== value.label);
    console.log(value);
    console.log(newOptions);
    this.setState({ options: newOptions, value: undefined }, () =>
      console.log(this.state.value)
    );
    this.props.dispatch(deleteWaveform(user, tag));
  };

  /**
   * Closes the no tag error
   */
  handleCloseModalNoTag = () => this.setState({ noTag: false });

  /**
   * Shows the no tag error
   */
  handleShowModalNoTag = () => this.setState({ noTag: true });

  /**
   * Closes the no waveform error
   */
  handleCloseModalNoWaveform = () => this.setState({ noWaveform: false });

  /**
   * Shows the no waveform error
   */
  handleShowModalNoWaveform = () => this.setState({ noWaveform: true });

  /**
   * Closes the no waveform or tag error
   */
  handleCloseModalNoAnything = () => this.setState({ noAnything: false });

  /**
   * Shows the no waveform or tag error
   */
  handleShowModalNoAnything = () => this.setState({ noAnything: true });

  /**
   * Renders the create-select box of tags
   */
  render() {
    const {
      options,
      value,
      comments,
      noTag,
      noWaveform,
      noAnything,
      dataLoaded,
      saveSuccess,
    } = this.state;
    return (
      <div id="comment-box">
        <strong> Tags & Comments </strong>
        <br></br>
        <CreatableSelect
          isClearable
          isDisabled={!dataLoaded}
          isLoading={!dataLoaded}
          onChange={this.handleChangeSelect}
          onCreateOption={this.handleCreateOption}
          options={options}
          value={value}
        />
        <div className="form-group">
          <textarea
            className="form-control"
            id="comments"
            rows="5"
            style={{ lineHeight: "100%", height: "200px" }}
            onChange={this.handleChangeTextArea}
            value={comments}
          ></textarea>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={this.handleSave}
          type="submit"
          active
          style={{ whiteSpace: "normal" }}
        >
          Save Tag {value ? value.label : ""}
        </Button>
        {saveSuccess ? <div style={{ color: "green" }}>Saved!</div> : null}
        <br />
        <Button
          style={{ marginTop: "10px", whiteSpace: "normal" }}
          variant="danger"
          size="sm"
          onClick={this.handleDelete}
          disabled={!value}
        >
          Delete Tag {value ? value.label : ""}
        </Button>
        <ErrorModal
          title="Save Error"
          body="You Need to Create or Select a Tag to Perform Save Operation!"
          show={noTag}
          handleClose={this.handleCloseModalNoTag}
        />
        <ErrorModal
          title="Save Error"
          body="You Need to Have a Waveform to Perform Save Operation!"
          show={noWaveform}
          handleClose={this.handleCloseModalNoWaveform}
        />
        <ErrorModal
          title="Save Error"
          body="You Need to Have a Waveform and a Tag to Perform Save Operation!"
          show={noAnything}
          handleClose={this.handleCloseModalNoAnything}
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
});

/**
 * Connects the component to redux store.
 * @type {Component}
 */
export default connect(mapStateToProps, null)(Tags);
