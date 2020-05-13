import React from "react";
import {
  BrowserRouter as Router,
  Redirect,
  Switch,
  Route
} from "react-router-dom";

import Login from "Login";
import Dashboard from "Dashboard";
import { deleteCookie, getCookie } from "helpers/cookies";
import { Button, Snackbar } from "@material-ui/core";
import * as storage from "storage/storage";
import { useMutation } from "react-query";
import axios from "axios";

/*
 * Entry point for app, containing the routes and logout handling.
 */
function App() {
  const [authToken, setAuthToken] = React.useState();
  const [logoutResult, setLogoutResult] = React.useState({});

  React.useEffect(() => {
    setAuthToken(getCookie("authToken"));
  }, []);

  const getLogout = () =>
    axios("/app/logout", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-AUTH-TOKEN": authToken
      }
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
      {authToken && (
        <Button
          type="submit"
          variant="contained"
          color="primary"
          onClick={handleLogout}
        >
          Log out
        </Button>
      )}
      <Router>
        <Switch>
          {!authToken && (
            <>
              <Route path="/login">
                <Login setAuthToken={setAuthToken} />
              </Route>
              <Redirect to="/login" />
            </>
          )}
          {!!authToken && (
            <>
              <Route path="/dashboard" component={Dashboard} exact />
              <Redirect to="/dashboard" />
            </>
          )}
        </Switch>
      </Router>

      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left"
        }}
        open={logoutResult.ok !== undefined}
        autoHideDuration={6000}
        onClose={handleCloseLogoutSnack}
        message={logoutResult.message}
      />
    </div>
  );
}

export default App;
