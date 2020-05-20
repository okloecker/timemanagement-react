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
 * Signup container.
 * Note that it is as of writing mostly identical to Login, but this will
 * change with a different signup/login workflow.
 */
const Signup = props => {
  const classes = useStyles();
  const [globalError, setGlobalError] = React.useState();

  const postSignup = ({ username, password, repeatPassword }) =>
    axios("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        username,
        password,
        repeatPassword
      }
    });
  const [mutate] = useMutation(postSignup);

  const handleMouseDownPassword = event => {
    event.preventDefault();
  };

  return (
    <div className={clsx(classes.form)}>
      <Formik
        initialValues={{ username: "", password: "", repeatPassword: "", isShowPassword: false }}
        validate={logSignValidateFun}
        onSubmit={async (values, { setFieldError, setStatus }) => {
          try {
            await mutate(
              {
                username: values.username,
                password: values.password,
                repeatPassword: values.isShowPassword
                  ? values.password
                  : values.repeatPassword
              },
              {
                onSuccess: response => {
                  const rqData = response.data; // react-query object
                  setStatus({
                    signupSuccessMessage: rqData.message
                  });
                  // props.setAuthToken(rqData.data.authToken.token);
                  // storage.local.setItem("userInfo", JSON.stringify(rqData.data));
                  setGlobalError(null);
                },
                onError: error => {
                  const rqData = error.response.data; // react-query object
                  const validation = rqData.error.validation;
                  if (validation) {
                    validation.forEach(v => {
                      setFieldError(
                        v.key,
                        v.message
                      );
                    })
                  }
                  if(rqData.error.code === "USER_EXISTS_ALREADY"){
                    setFieldError("username", rqData.error.message);
                  }
                  setStatus({
                    signupSuccessMessage: null
                  });
                  if (error.response.statusText) {
                    setGlobalError({
                      message: `Signup failed with error: ${
                        error.response.statusText
                      }`
                    });
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
          touched,
          status,
          handleChange,
          handleSubmit,
          handleBlur,
          setFieldValue,
          isSubmitting
        }) => (
          <Container component="main" maxWidth="xs">
            <CssBaseline />
            <div className={classes.paper}>
              <Typography component="h1" variant="h5">
                Sign up
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
                  type={values.isShowPassword ? "text" : "password"}
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
                          onClick={_ =>
                            setFieldValue(
                              "isShowPassword",
                              !values.isShowPassword
                            )
                          }
                          onMouseDown={handleMouseDownPassword}
                        >
                          {values.isShowPassword ? (
                            <Visibility />
                          ) : (
                            <VisibilityOff />
                          )}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                {values.isShowPassword || (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="repeatPassword"
                    label="Repeat Password"
                    type={"password"}
                    id="repeatPassword"
                    autoComplete="current-repeatPassword"
                    value={values.repeatPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={!!errors.repeatPassword && touched.repeatPassword}
                    helperText={errors.repeatPassword}
                  />
                )}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  className={classes.submit}
                >
                  Sign up
                </Button>
                {isSubmitting && <LinearProgress />}
                {(status || {}).signupSuccessMessage && (
                  <Alert severity="success">
                    {(status || {}).signupSuccessMessage}
                  </Alert>
                )}
                <Grid container>
                  <Grid item>
                    <Link href="/login" variant="body2">
                      {"Login"}
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

export default Signup;
