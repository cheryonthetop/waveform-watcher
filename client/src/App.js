import React, { Component } from "react";
import "./App.css";

import { Provider } from "react-redux";
import { authenticate } from "./actions/userActions";
import store from "./store";
import Routes from "./components/routes/Routes";

/**
 * The App Component to be embedded to the root div
 */
class App extends Component {
  /**
   * Authenticates the user, loading the data
   * if authenticated
   */
  componentDidMount() {
    store.dispatch(authenticate());
  }

  /**
   * Renders the app
   */
  render() {
    return (
      <Provider store={store}>
        <div className="App">
          <Routes id="routes" />
        </div>
      </Provider>
    );
  }
}

export default App;
