import { Box, Button, Snackbar } from "@material-ui/core";
import axios from "axios";
import Dashboard from "Dashboard";
import { deleteCookie, getCookie } from "helpers/cookies";
import Login from "Login";
import React from "react";
import { useMutation } from "react-query";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch
} from "react-router-dom";
import Signup from "Signup";
import * as storage from "storage/storage";

/*
 * Entry point for app, containing the routes and logout handling.
 */
function App() {
  const [authToken, setAuthToken] = React.useState(getCookie("authToken"));
  const [logoutResult, setLogoutResult] = React.useState({});

  const getLogout = () =>
    axios("/app/logout", {
      method: "GET",
      headers: { "Content-Type": "application/json", "X-AUTH-TOKEN": authToken }
    });
  const [mutate] = useMutation(getLogout);
  const handleLogout = async () => {
    try {
      await mutate(null, {
        onSuccess: response => {
          setLogoutResult({ ok: true, message: response.data.success.message });
          deleteCookie("authToken");
          deleteCookie("PLAY_SESSION");
          setAuthToken(null);
          storage.local.removeItem("userInfo");
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
          deleteCookie("authToken");
          deleteCookie("PLAY_SESSION");
          setAuthToken(null);
          storage.local.removeItem("userInfo");
        }
      });
    } catch (err) {
      console.log("POST logout error", err);
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
