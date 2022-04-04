import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { graphql, useMutation } from '@apollo/react-hoc';
import ReactJson from 'react-json-view';
import { withStyles } from '@material-ui/core/styles';
import { Button, TextareaAutosize } from '@material-ui/core';
import { connect } from 'react-redux';
import { ADD_COMPUTATION_MUTATION, FETCH_COMPUTATION_QUERY } from '../../state/graphql/functions';
import { compIOProp } from '../../state/graphql/props';
import { notifySuccess, notifyError } from '../../state/ducks/notifyAndLog';

const styles = theme => ({
  wrapper: {
    marginTop: theme.spacing(1),
  },
  computationActions: {
    display: 'flex',
    justifyContent: 'space-between',
  },
});

const ComputationIO = ({
  compIO, classes, notifySuccess, notifyError, auth,
}) => {
  if (!compIO) {
    return null;
  }

  const showEdit = auth.user.permissions.roles?.admin
    || (auth.user.permissions.roles?.author && compIO.submittedBy === auth.user.id);

  const prepareJSON = (info) => {
    const compSpecDbObject = JSON.parse(JSON.stringify(info));

    delete compSpecDbObject.id;
    delete compSpecDbObject.__typename;
    delete compSpecDbObject?.computation?.__typename;
    delete compSpecDbObject?.computation?.remote?.__typename;
    delete compSpecDbObject?.meta?.__typename;
    delete compSpecDbObject.submittedBy;


    return JSON.stringify(compSpecDbObject, null, 4);
  };

  const [textAreaValue, setTextAreaValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [addComputation] = useMutation(ADD_COMPUTATION_MUTATION);


  const updateComputation = () => {
    try {
      const val = JSON.parse(textAreaValue);
      addComputation({
        variables: { computationSchema: val },
      }).then((e) => {
        notifySuccess('Compspec updated');
        setIsEditing(false);
      }).catch((e) => {
        notifyError(e.message);
      });
    } catch (e) {
      notifyError(e.message);
    }
  };

  useEffect(() => {
    setTextAreaValue(prepareJSON(compIO));
  }, []);


  return (
    <div className={classes.wrapper}>
      {isEditing
        ? (
          <TextareaAutosize
            value={textAreaValue}
            onChange={(e) => { setTextAreaValue(e.target.value); }}
            style={{ width: '100%' }}
          />
        )
        : (
          <ReactJson
            src={JSON.parse(prepareJSON(compIO))}
            theme="monokai"
            displayDataTypes={false}
            displayObjectSize={false}
            enableClipboard={false}
          />
        )
      }
      <div className={classes.computationActions}>
        {showEdit
          && (
            <Button
              variant="contained"
              color={isEditing ? 'secondary' : 'primary'}
              onClick={() => {
                setIsEditing(!isEditing);
              }}
            >
              {isEditing ? 'cancel' : 'edit'}
            </Button>
          )
        }

        {isEditing
          && (
            <Button
              variant="contained"
              color="primary"
              onClick={updateComputation}
            >
              update
            </Button>
          )
        }
      </div>
    </div>
  );
};

ComputationIO.defaultProps = {
  compIO: null,
};

ComputationIO.propTypes = {
  compIO: PropTypes.object,
  classes: PropTypes.object.isRequired,
  notifyError: PropTypes.func.isRequired,
  notifySuccess: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = ({ auth }) => ({
  auth,
});

const ComputationIOWithData = graphql(FETCH_COMPUTATION_QUERY, compIOProp)(ComputationIO);
const ComputationIOWithAlert = connect(mapStateToProps, { notifySuccess, notifyError })(ComputationIOWithData);

export default withStyles(styles)(ComputationIOWithAlert);
