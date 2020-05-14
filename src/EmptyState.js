import React from "react";
import { Card, CardContent, Fab, Typography } from "@material-ui/core";
import { Add } from "@material-ui/icons";

const EmptyState = ({
  classes,
  handleAddRecord,
  addRow,
  setAddRow,
  handleRecordAdd
}) => (
  <Card className={classes.root}>
    <CardContent>
      <Typography className={classes.title} color="textSecondary" gutterBottom>
        There is no data to display for these dates, try to change start and end
        dates. Or add a new record:
      </Typography>
        <Typography align="center" gutterBottom>
          <Fab
            color="primary"
            aria-label="add"
            onClick={handleAddRecord}
            size="small"
          >
            <Add />
          </Fab>
        </Typography>
    </CardContent>
  </Card>
);

export default EmptyState;
