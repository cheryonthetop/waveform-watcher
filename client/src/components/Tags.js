import React, { Component } from "react";
import { connect } from "react-redux";
import { saveWaveform, switchWaveform } from "../actions/waveformActions";

import CreatableSelect from "react-select/creatable";

const createOption = (label, data) => ({
  label,
  data: data,
});

const defaultOptions = [];

class Tags extends Component {
  state = {
    isLoading: false,
    options: defaultOptions,
    value: undefined,
    data_loaded: false,
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
  handleChange = (newValue, actionMeta) => {
    console.group("Value Changed");
    console.log(newValue);
    console.log(`action: ${actionMeta.action}`);
    console.groupEnd();
    this.setState({ value: newValue });
    if (actionMeta.action === "select-option") {
      this.setState({ comments: newValue.data.comments });
      const { run_id, build_low_level, bokeh_model } = newValue.data;
      if (bokeh_model && run_id && build_low_level)
        this.props.dispatch(
          switchWaveform(run_id, build_low_level, bokeh_model)
        );
    }
  };
  handleCreate = (inputValue) => {
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
    const tag = value.label;
    const comments = value.data.comments;
    const { user, bokeh_model, run_id, build_low_level } = this.props;
    this.props.dispatch(
      saveWaveform(user, tag, comments, bokeh_model, run_id, build_low_level)
    );
  };

  render() {
    const { isLoading, options, value, comments } = this.state;
    return (
      <div>
        <CreatableSelect
          isClearable
          isDisabled={isLoading}
          isLoading={isLoading}
          onChange={this.handleChange}
          onCreateOption={this.handleCreate}
          options={options}
          value={value}
        />
        <textarea
          id="comments"
          className="ct"
          style={{ lineHeight: "100%", height: "200px" }}
          onChange={(event) => {
            let newComments = event.target.value;
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
          }}
          value={comments}
        ></textarea>
        <button onClick={this.handleSave}>
          Save this Waveform under the Tag {value ? value.label : ""}
        </button>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.waveform.user,
  tags_data: state.waveform.tags_data,
  bokeh_model: state.waveform.bokeh_model,
  run_id: state.waveform.run_id,
  build_low_level: state.waveform.build_low_level,
});

export default connect(mapStateToProps, null)(Tags);
