import React from "react";
import { Box, IconButton, Menu, MenuItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import { Link } from "react-router-dom";

const options = {
  dashboard: "Dashboard",
  reports: "Reports",
  logout: "Logout"
};

const useStyles = makeStyles(theme => ({
  menuBtn: {
    textDecoration: "none",
    '&:visited': {
      color: 'initial'
    }
  }
}));

const MoreMenu = ({ onLogout }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = ({ currentTarget: { id } }) => {
    if(id === "logout") onLogout();
    setAnchorEl(null);
  };

  // const handleSelect = ({ currentTarget: { id } }) => {
  //   switch (id) {
  //     case "Dashboard":
  //       break;
  //     case "Reports":
  //       break;
  //     case "Logout":
  //       onLogout();
  //       break;
  //     default:
  //     // can't happen
  //   }
  // };

  return (
    <div>
      <Box m={2}>
        <IconButton
          aria-label="more"
          aria-controls="more-menu"
          aria-haspopup="true"
          onClick={handleClick}
        >
          <MoreVertIcon />
        </IconButton>
      </Box>
      <Menu
        id="more-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
      >
        {Object.keys(options).map(option => (
          <MenuItem key={option} id={option} onClick={handleClose}>
            <Link to={`/${option}`} className={classes.menuBtn}>
              {options[option]}
            </Link>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export { MoreMenu };
