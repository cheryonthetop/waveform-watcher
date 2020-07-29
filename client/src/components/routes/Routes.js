import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Success from "./Success";
import Failure from "./Failure";
import Waveform from "./Waveform";
import WaveformURL from "./WaveformURL";
import ErrorModal from "../ErrorModal";
import { connect } from "react-redux";
import { errorServed } from "../../actions/errorActions";

/**
 * The "brain" of the app. Handles the routing. Also displays
 * error received from API response
 */
class Routes extends Component {
  /**
   * Closes the error modal by dispatching errorServed action
   * which toggles the error state
   */
  handleCloseModal = () => this.props.dispatch(errorServed());
  /**
   * Renders the routes with react router. An Error Modal
   * pops up if there is an error reported at the central
   * redux state
   */
  render() {
    const { error, title, msg } = this.props;
    return (
      <BrowserRouter>
        <div style={{ height: "100vh" }}>
          <Route exact path="/login" component={Login} />
          <Route exact path="/login/success" component={Success} />
          <Route exact path="/login/failure" component={Failure} />
          <Route exact path="/waveform" component={Waveform} />
          <Route exact path="/waveform/:run/:event" component={WaveformURL} />
          <Route exact path="/" component={Home} />
          <ErrorModal
            title={title}
            body={msg}
            show={error}
            handleClose={this.handleCloseModal}
          />
        </div>
      </BrowserRouter>
    );
  }
}

/**
 * Maps the central state to props in this page
 * @param {Object} state The central state in redux store
 * @type {Function}
 */
const mapStateToProps = (state) => ({
  title: state.error.title,
  error: state.error.error,
  msg: state.error.msg,
});

/**
 * Connects the component to redux store. Exposes the component
 * to react router dom to allow redirecting through history
 * @type {Component}
 */
export default connect(mapStateToProps, null)(Routes);
