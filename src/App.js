import { Box, Button, Snackbar } from "@material-ui/core";
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
import { getStorageItemJson, removeStorageItem } from "storage/storage";

/*
 * Entry point for app, containing the routes and logout handling.
 */
function App() {
  const [authToken, setAuthToken] = React.useState(
    ((getStorageItemJson("userInfo") || {}).authToken || {}).token
  );
  const [logoutResult, setLogoutResult] = React.useState({});

  const getLogout = () =>
    axios("/api/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json", AuthToken: authToken },
      data: { userId: (getStorageItemJson("userInfo") || {}).id }
    });
  const [mutate] = useMutation(getLogout);
  const handleLogout = async () => {
    try {
      await mutate(null, {
        onSuccess: response => {
          setLogoutResult({ ok: true, message: response.data.message });
          setAuthToken(null);
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
          setAuthToken(null);
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
      {authToken ? (
        <Box m={2}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </Box>
      ) : null}
      <Router>
        {!!authToken ? (
          <Switch>
            <Route path="/dashboard">
              <Dashboard />
            </Route>
            <Redirect to="/dashboard" />
          </Switch>
        ) : (
          <Switch>
            <Route path="/login">
              <Login setAuthToken={setAuthToken} />
            </Route>
            <Route path="/signup">
              <Signup setAuthToken={setAuthToken} />
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
