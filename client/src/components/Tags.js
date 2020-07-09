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
    isLoading: false,
    data_loaded: false,
    show: false,
    options: defaultOptions,
    value: undefined,
    comments: "",
  };

  componentDidUpdate() {
    const { data_loaded } = this.state;
    if (this.props.tags_data && !data_loaded) {
      console.log("tags data is:" + this.props.tags_data);
      this.loadOptions();
      this.setState({ data_loaded: true });
    }
  }

  loadOptions = () => {
    let newOptions = [];
    this.props.tags_data.map((tag_data) =>
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
      const { run_id, event, bokeh_model } = newValue.data;
      if (bokeh_model && run_id && event)
        this.props.dispatch(switchWaveform(run_id, event, bokeh_model));
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
      const newOption = createOption(inputValue, {});
      console.log(newOption);
      console.groupEnd();
      this.setState({
        isLoading: false,
        options: [...options, newOption],
        value: newOption,
        comments: "",
      });
    }, 1000);
  };

  handleSave = () => {
    const { value } = this.state;
    const { user, bokeh_model, run_id, event } = this.props;
    if (value && bokeh_model) {
      const tag = value.label;
      const comments = value.data.comments;
      this.props.dispatch(
        saveWaveform(user, tag, comments, bokeh_model, run_id, event)
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
      data_loaded,
    } = this.state;
    return (
      <div id="comment-box">
        <strong> Tags & Comments </strong>
        <br></br>
        <CreatableSelect
          isClearable
          isDisabled={!data_loaded}
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
  tags_data: state.waveform.tags_data,
  bokeh_model: state.waveform.bokeh_model,
  run_id: state.waveform.run_id,
  event: state.waveform.event,
});

export default connect(mapStateToProps, null)(Tags);
