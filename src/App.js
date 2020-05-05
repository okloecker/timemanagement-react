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

function App() {
  const [authToken, setAuthToken] = React.useState();
  const [logoutResult, setLogoutResult] = React.useState({});

  React.useEffect(() => {
    setAuthToken(getCookie("authToken"));
  }, []);

  const getLogout = () =>
    fetch("/app/logout", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-AUTH-TOKEN": authToken
      }
    });
  const [mutate] = useMutation(getLogout);
  const handleLogout = async () => {
    const fetchResult = await mutate();
    if (!fetchResult.ok) {
      setLogoutResult({ ok: fetchResult.ok, message: fetchResult.statusText });
      deleteCookie("authToken");
      setAuthToken(null);
    }
    if (
      (((fetchResult || {}).headers || {}).get("content-type") || "").includes(
        "application/json"
      )
    ) {
      const json = await fetchResult.json();
      if ((json.error || {}).message) {
        setLogoutResult({ ok: false, message: json.error.message });
      } else if ((json.success || {}).message) {
        setAuthToken(null);
        setLogoutResult({
          ok: fetchResult.ok,
          message: (json.success || {}).message
        });
        storage.local.removeItem("userInfo");
      }
    }
  };

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
        message={`Logout: ${logoutResult.message}`}
      />
    </div>
  );
}

export default App;
