const logSignValidateFun = values => {
  const errors = {};

  if (!values.username) {
    errors.username = "Required";
  } else if (values.username.length < 1 || values.username.length > 16) {
    errors.username = "Username must be between 1 and 16 characters.";
  }

  if (!values.password) {
    errors.password = "Required";
  } else if (values.password.length < 8 || values.password.length > 78) {
    errors.password = "Password length must be between 8 and 78 characters.";
  }

  if (values.repeatPassword !== undefined && !values.isShowPassword) {
    if (!values.repeatPassword) {
      errors.repeatPassword = "Required";
    } else if (values.password !== values.repeatPassword) {
      errors.repeatPassword = "Passwords don't match.";
    } else if (
      values.repeatPassword.length < 8 ||
      values.repeatPassword.length > 78
    ) {
      errors.repeatPassword =
        "Password length must be between 8 and 78 characters.";
    }
  }

  return errors;
};

export { logSignValidateFun };
