import React, { useState } from 'react';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Collapse from '@material-ui/core/Collapse';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FileCopyIcon from '@material-ui/icons/FileCopy';

export default function (props) {
  const { excludedSubjects } = props;
  const [expandList, setExpandList] = useState(false);

  if (!excludedSubjects) {
    return null;
  }

  return (
    <div>
      <Paper variant="outlined">
        <List disablePadding>
          <ListItem button onClick={() => setExpandList(!expandList)}>
            <ListItemIcon>
              <FileCopyIcon />
            </ListItemIcon>
            <ListItemText primary={excludedSubjects ? `Excluding ${excludedSubjects.length} subjects` : 'Excluding 0 subjects'} />
            {expandList ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItem>
        </List>
        <Collapse in={expandList} timeout="auto">
          <List disablePadding>
            {
              excludedSubjects.map(subject => (
                <ListItem key={subject.name} button>
                  <ListItemText>
                    <Typography
                      component="span"
                      variant="body2"
                      color="textPrimary"
                    >
                      {`${subject.name} > ${subject.error}`}
                    </Typography>
                  </ListItemText>
                </ListItem>
              ))
            }
          </List>
        </Collapse>
      </Paper>
    </div>
  );
}
