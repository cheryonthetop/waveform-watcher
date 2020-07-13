import React, { Component } from "react";
import { connect } from "react-redux";
import {
  saveWaveform,
  switchWaveform,
  deleteWaveform,
} from "../actions/waveformActions";
import { Button, Modal } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";

const createOption = (label, data) => ({
  label,
  data: data,
});

const defaultOptions = [];

class Tags extends Component {
  state = {
    isLoading: this.props.isLoading,
    dataLoaded: false,
    show: false,
    options: defaultOptions,
    value: undefined,
    comments: " ",
  };

  componentDidMount() {
    this.tryLoadOptions();
  }

  componentDidUpdate() {
    this.tryLoadOptions();
  }

  tryLoadOptions() {
    const { options, dataLoaded } = this.state;
    const { tagsData } = this.props;
    if (!dataLoaded) {
      console.log("tags data is:" + tagsData);
      this.loadOptions();
      this.setState({ dataLoaded: true });
    }
  }

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

  handleChangeSelect = (newValue, actionMeta) => {
    console.group("Value Changed");
    console.log(newValue);
    console.log(`action: ${actionMeta.action}`);
    console.groupEnd();
    this.setState({ value: newValue });
    if (actionMeta.action === "select-option") {
      this.setState({ comments: newValue.data.comments });
      const { runID, eventID, waveform } = newValue.data;
      if (waveform && runID)
        this.props.dispatch(switchWaveform(runID, eventID, waveform));
    }
  };

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

  handleCreateOption = (inputValue) => {
    this.setState({ isLoading: true });
    console.group("Option created");
    console.log("Wait a moment...");
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

  handleSave = () => {
    const { value } = this.state;
    const { user, waveform, runID, eventID } = this.props;
    if (value && waveform) {
      const tag = value.label;
      const comments = value.data.comments;
      this.props.dispatch(
        saveWaveform(user, tag, comments, waveform, runID, eventID)
      );
    } else {
      this.handleShow();
    }
  };

  handleDelete = () => {
    const { value, options } = this.state;
    const { user } = this.props;
    const tag = value.label;
    const newOptions = options.filter((option) => option.label !== value.label);
    console.log(value);
    console.log(newOptions);
    this.setState({ options: newOptions, value: {} }, () =>
      console.log(this.state.value)
    );
    this.props.dispatch(deleteWaveform(user, tag));
  };

  handleClose = () => this.setState({ show: false });

  handleShow = () => this.setState({ show: true });

  render() {
    const {
      isLoading,
      options,
      value,
      comments,
      show,
      dataLoaded,
    } = this.state;
    return (
      <div id="comment-box">
        <strong> Tags & Comments </strong>
        <br></br>
        <CreatableSelect
          isClearable
          isDisabled={!dataLoaded}
          isLoading={isLoading}
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
        >
          Save Waveform under Tag
          {value ? " " + value.label : ""}
        </Button>
        <Modal show={show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Save error</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            You need to enter a tag AND get a waveform to save!
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
        <Button
          style={{ marginTop: "10px" }}
          variant="danger"
          size="sm"
          onClick={this.handleDelete}
          disabled={!value}
        >
          Delete Tag {value ? value.label : ""}
        </Button>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.waveform.user,
  tagsData: state.waveform.tagsData,
  waveform: state.waveform.waveform,
  runID: state.waveform.runID,
  eventID: state.waveform.eventID,
  isLoading: state.waveform.isLoading,
});

export default connect(mapStateToProps, null)(Tags);
