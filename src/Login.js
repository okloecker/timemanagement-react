import React from "react";
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
  Grid,
  LinearProgress,
  Link,
  TextField,
  Typography
} from "@material-ui/core";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import { makeStyles } from "@material-ui/core/styles";
import { Formik } from "formik";
import { useMutation } from "react-query";
import log from "loglevel";
import { logSignValidateFun } from "helpers/validate";
import Copyright from "Copyright";

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

/*
 * Login container.
 * Note that it is as of writing mostly identical to Signup, but this will
 * change with a different signup/login workflow.
*/
const Login = props => {
  const classes = useStyles();
  const [isShowPassword, setShowPassword] = React.useState(false);
  const [globalError, setGlobalError] = React.useState();

  const postLogin = ({ username, password }) =>
    axios("/api/auth/login", {
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
        validate={logSignValidateFun}
        onSubmit={async (values, { setFieldError, setStatus }) => {
          try {
            await mutate(
              {
                username: values.username,
                password: values.password
              },
              {
                onSuccess: response => {
                  const rqData = response.data; // react-query object
                  setStatus({
                    loginSuccessMessage: rqData.message
                  });
                  props.setUserInfo(rqData.data);
                },
                onError: error => {
                  const rqData = error.response.data; // react-query object
                  if (rqData) {
                    if (rqData.username)
                      setFieldError(
                        "username",
                        rqData.username.join()
                      );
                    if (rqData.password)
                      setFieldError(
                        "password",
                        rqData.password.join()
                      );
                    if (rqData.error) {
                      setFieldError(
                        "username",
                        rqData.error.message
                      );
                      setFieldError(
                        "password",
                        rqData.error.message
                      );
                    }
                  }
                  if (error.response.statusText) {
                    setGlobalError({
                      message: `Login failed with error: ${
                        error.response.statusText
                      }`
                    });
                  }
                }
              }
            );
          } catch (err) {
            log.error("POST error", err);
          }
        }}
      >
        {({
          values,
          errors,
          touched,
          status,
          handleChange,
          handleSubmit,
          handleBlur,
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
                  onBlur={handleBlur}
                  error={!!errors.username && touched.username}
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
                  onBlur={handleBlur}
                  error={!!errors.password && touched.password}
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
                <Grid container>
                  <Grid item>
                    <Link href="/signup" variant="body2">
                      {"Don't have an account? Sign Up"}
                    </Link>
                  </Grid>
                </Grid>
              </form>
            </div>
            {globalError && (
              <Alert severity="error">{globalError.message}</Alert>
            )}
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
