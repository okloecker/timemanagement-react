import React from "react";
import * as storage from "storage/storage";
import { getCookie } from "helpers/cookies";

import clsx from "clsx";

import Alert from "@material-ui/lab/Alert";
import {
  Box,
  Button,
  Container,
  CssBaseline,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link,
  TextField,
  Typography
} from "@material-ui/core";
// import Grid from "@material-ui/core/Grid";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import { makeStyles } from "@material-ui/core/styles";
import { Formik } from "formik";
import { useMutation } from "react-query";

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {"Copyright © "}
      <Link color="inherit" href="https://memomolecule.com/">
        Olaf Klöcker
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(1)
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  }
}));

const Login = props => {
  const classes = useStyles();
  const [isShowPassword, setShowPassword] = React.useState(false);

  const postLogin = ({ username, password }) =>
    fetch("/app/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

  const [mutate] = useMutation(postLogin);

  const handleClickShowPassword = () => {
    setShowPassword(prevIsShowPassword => !isShowPassword);
  };

  const handleMouseDownPassword = event => {
    event.preventDefault();
  };

  return (
    <div className={clsx(classes.form)}>
      <Formik
        initialValues={{ username: "", password: "" }}
        validate={values => {
          const errors = {};
          if (!values.username) {
            errors.username = "Required";
          } else if (
            values.username.length < 1 ||
            values.username.length > 16
          ) {
            errors.username = "Username must be between 1 and 16 characters.";
          }
          if (!values.password) {
            errors.password = "Required";
          } else if (
            values.password.length < 8 ||
            values.password.length > 78
          ) {
            errors.password =
              "Password length must be between 8 and 78 characters.";
          }
          return errors;
        }}
        onSubmit={async (values, { setFieldError, setStatus }) => {
          const fetchResult = await mutate({
            username: values.username,
            password: values.password
          });

          if (
            (
              ((fetchResult || {}).headers || {}).get("content-type") || ""
            ).includes("application/json")
          ) {
            const json = await fetchResult.json();
            if (json.username) setFieldError("username", json.username.join());
            else if (json.password)
              setFieldError("password", json.password.join());
            else if ((json.error || {}).message) {
              setFieldError("username", json.error.message);
              setFieldError("password", json.error.message);
            } else if ((json.success || {}).message) {
              setStatus({ loginSuccessMessage: json.success.message });
              props.setAuthToken(getCookie("authToken"));
              const { message, ...rest } = json.success;
              storage.local.setItem("userInfo", JSON.stringify(rest));
            }
          }
        }}
      >
        {({
          values,
          errors,
          status,
          handleChange,
          handleSubmit,
          isSubmitting
        }) => (
          <Container component="main" maxWidth="xs">
            <CssBaseline />
            <div className={classes.paper}>
              <Typography component="h1" variant="h5">
                Log in
              </Typography>
              <form className={clsx(classes.form)} onSubmit={handleSubmit}>
                {(status || {}).generalError && <p>{status.generalError}</p>}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  value={values.username}
                  label="Username"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  onChange={handleChange}
                  error={!!errors.username}
                  helperText={errors.username}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={isShowPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  value={values.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  inputProps={{ id: "password" }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                        >
                          {isShowPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  className={classes.submit}
                >
                  Log in
                </Button>
                {isSubmitting && <LinearProgress />}
                {(status || {}).loginSuccessMessage && (
                  <Alert severity="success">
                    {(status || {}).loginSuccessMessage}
                  </Alert>
                )}
                {/*
                <Grid container>
                  <Grid item xs>
                    <Link href="#" variant="body2">
                      Forgot password?
                    </Link>
                  </Grid>
                  <Grid item>
                    <Link href="#" variant="body2">
                      {"Don't have an account? Sign Up"}
                    </Link>
                  </Grid>
                </Grid>
                */}
              </form>
            </div>
            <Box mt={8}>
              <Copyright />
            </Box>
          </Container>
        )}
      </Formik>
    </div>
  );
};

export default Login;
