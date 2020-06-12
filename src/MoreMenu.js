import React from "react";
import { Box, IconButton, Menu, MenuItem } from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";

const options = ["Dashboard", "Reports", "Logout"];

const MoreMenu = ({ onLogout }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = ({ currentTarget: { id } }) => {
    switch (id) {
      case "Dashboard":
        break;
      case "Reports":
        break;
      case "Logout":
        onLogout();
        break;
      default:
      // can't happen
    }
  };

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
        {options.map(option => (
          <MenuItem key={option} id={option} onClick={handleSelect}>
            {option}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export { MoreMenu };
