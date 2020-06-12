import { Snackbar } from "@material-ui/core";
import axios from "axios";
import Dashboard from "Dashboard";
import Login from "Login";
import React from "react";
import { useMutation } from "react-query";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch
} from "react-router-dom";
import log from "loglevel";
import Signup from "Signup";
import { MoreMenu } from "MoreMenu";
import {
  getStorageItemJson,
  setStorageItemJson,
  removeStorageItem
} from "storage/storage";

const getAuthToken = userInfo => ((userInfo || {}).authToken || {}).token;

/*
 * Entry point for app, containing the routes and logout handling.
 */
function App() {
  const [userInfo, setUserInfo] = React.useState(
    getStorageItemJson("userInfo") || {}
  );
  const [logoutResult, setLogoutResult] = React.useState({});

  const updateUserInfo = userInfo => {
    setStorageItemJson("userInfo", userInfo);
    setUserInfo(userInfo);
  };

  const getLogout = () =>
    axios("/api/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        AuthToken: getAuthToken(userInfo)
      },
      data: { userId: (getStorageItemJson("userInfo") || {}).id }
    });
  const [mutate] = useMutation(getLogout);
  const handleLogout = async () => {
    try {
      await mutate(null, {
        onSuccess: response => {
          setLogoutResult({ ok: true, message: response.data.message });
          updateUserInfo(null);
          removeStorageItem("userInfo");
        },
        onError: error => {
          if (error.response.data) {
            if (error.response.data.error) {
              setLogoutResult({
                ok: false,
                message: error.response.data.error.message
              });
            }
          }
          updateUserInfo(null);
          removeStorageItem("userInfo");
        }
      });
    } catch (err) {
      log.error("POST logout error", err);
    }
  };

  /* Show "snack" message on bottom left on logging out */
  const handleCloseLogoutSnack = (event, reason) => {
    setLogoutResult({});
  };

  return (
    <div>
      {getAuthToken(userInfo) &&
      <MoreMenu onLogout={handleLogout} />
      }
      <Router>
        {!!getAuthToken(userInfo) ? (
          <Switch>
            <Route path="/dashboard">
              <Dashboard userInfo={userInfo} />
            </Route>
            <Redirect to="/dashboard" />
          </Switch>
        ) : (
          <Switch>
            <Route path="/login">
              <Login setUserInfo={updateUserInfo} />
            </Route>
            <Route path="/signup">
              <Signup setUserInfo={updateUserInfo} />
            </Route>
            <Redirect to="/login" />
          </Switch>
        )}
      </Router>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        open={logoutResult.ok !== undefined}
        autoHideDuration={6000}
        onClose={handleCloseLogoutSnack}
        message={logoutResult.message}
      />
    </div>
  );
}

export default App;
