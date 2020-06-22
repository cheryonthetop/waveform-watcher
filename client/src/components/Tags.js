import React, { Component } from "react";
import { connect } from "react-redux";

import CreatableSelect from "react-select/creatable";

const createOption = (tag, comment) => ({
  tag,
  value: comment,
});

class Tags extends Component {
  state = {
    isLoading: false,
    options: [],
    value: undefined,
    tags_data: this.props.tags_data,
  };
  componentDidMount() {
    if (this.props.tags_data.length !== 0) this.loadOptions();
  }
  componentDidUpdate() {
    if (this.props.tags_data !== this.state.tags_data) {
      this.loadOptions();
      this.state.tags_data = this.props.tags_data;
    }
  }
  loadOptions = () => {
    this.setState((state) => {
      const newOptions = this.props.tags_data.map((tag_data) =>
        Object.entries(tag_data).map(([tag, data]) => {
          createOption(tag, data.comments);
        })
      );
      console.log("loaded options are: ", newOptions);
      return {
        options: newOptions,
      };
    });
    console.log(this.state.options);
  };
  handleChange = (newValue, actionMeta) => {
    console.group("Value Changed");
    console.log(newValue);
    console.log(`action: ${actionMeta.action}`);
    console.groupEnd();
    this.setState({ value: newValue });
    if (newValue !== null) this.props.handleStateChangeTag(newValue.value);
  };
  handleCreate = (inputValue) => {
    this.setState({ isLoading: true });
    console.group("Option created");
    console.log("Wait a moment...");
    setTimeout(() => {
      const { options } = this.state;
      const newOption = createOption(inputValue, "");
      console.log(newOption);
      console.groupEnd();
      this.setState({
        isLoading: false,
        options: [...options, newOption],
        value: newOption,
      });
    }, 1000);
  };

  render() {
    const { isLoading, options, value } = this.state;
    return (
      <CreatableSelect
        isClearable
        isDisabled={isLoading}
        isLoading={isLoading}
        onChange={this.handleChange}
        onCreateOption={this.handleCreate}
        options={options}
        value={value}
        defaultInputValue="default tag"
      />
    );
  }
}

const mapStateToProps = (state) => ({
  tags_data: state.waveform.tags_data,
});

export default connect(mapStateToProps, null)(Tags);
