import React from "react";
import * as storage from "storage/storage";
import { getCookie } from "helpers/cookies";
import axios from "axios";

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
    axios("/app/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        username,
        password
      }
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
          try {
            await mutate(
              {
                username: values.username,
                password: values.password
              },
              {
                onSuccess: response => {
                  setStatus({
                    loginSuccessMessage: response.data.success.message
                  });
                  props.setAuthToken(getCookie("authToken"));
                  const { message, ...rest } = response.data.success;
                  storage.local.setItem("userInfo", JSON.stringify(rest));
                },
                onError: error => {
                  if (error.response.data) {
                    if (error.response.data.username)
                      setFieldError(
                        "username",
                        error.response.data.username.join()
                      );
                    if (error.response.data.password)
                      setFieldError(
                        "password",
                        error.response.data.password.join()
                      );
                    if (error.response.data.error) {
                      setFieldError(
                        "username",
                        error.response.data.error.message
                      );
                      setFieldError(
                        "password",
                        error.response.data.error.message
                      );
                    }
                  }
                }
              }
            );
          } catch (err) {
            console.log("POST error", err);
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
