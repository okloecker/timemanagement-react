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
  return errors;
};


export {
  logSignValidateFun
};
