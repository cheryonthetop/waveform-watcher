import React, { Component } from "react";
import "./App.css";

import { Provider } from "react-redux";
import { authenticate } from "./actions/userActions";
import store from "./store";
import Routes from "./components/Routes";

class App extends Component {
  componentDidMount() {
    // remember me
    store.dispatch(authenticate());
  }
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
