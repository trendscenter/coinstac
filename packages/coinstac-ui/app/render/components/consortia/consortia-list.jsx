import React, { Component } from 'react';
import { Link } from 'react-router';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import memoize from 'memoize-one';
import MemberAvatar from '../common/member-avatar';
import ListItem from '../common/list-item';
import ListDeleteModal from '../common/list-delete-modal';

const MAX_LENGTH_CONSORTIA = 50;

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  },
  contentContainer: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  subtitle: {
    marginTop: theme.spacing.unit * 2,
  },
  label: {
    fontWeight: 'bold',
  },
  labelInline: {
    fontWeight: 'bold',
    marginRight: theme.spacing.unit,
    display: 'inline-block',
  },
  value: {
    display: 'inline-block',
  },
  green: {
    color: 'green',
  },
  red: {
    color: 'red',
  },
});

const isUserA = (userId, groupArr) => {
  return groupArr.indexOf(userId) !== -1;
};

class ConsortiaList extends Component {
  state = {
    consortiumToDelete: -1,
    showModal: false,
  };

  consortiaClassification = memoize(
    (consortia, loggedInUser) => {
      const classification = {
        memberConsortia: [],
        otherConsortia: [],
      };

      if (!consortia || consortia.length > MAX_LENGTH_CONSORTIA) {
        return classification;
      }

      consortia.forEach((cons) => {
        if (cons.owners.indexOf(loggedInUser.id) > -1
          || cons.members.indexOf(loggedInUser.id) > -1
        ) {
          classification.memberConsortia.push(cons);
        } else {
          classification.otherConsortia.push(cons);
        }
      });

      return classification;
    }
  );

  getOptions = (member, owner, consortium) => {
    const actions = [];
    const text = [];
    let isMapped = false;
    const { classes, pipelines } = this.props;

    // Add pipeline text
    text.push(
      <div key={`${consortium.id}-active-pipeline-text`} className={classes.contentContainer}>
        <Typography className={classes.labelInline}>
          Active Pipeline:
        </Typography>
        {
          consortium.activePipelineId
            ? (
              <Typography className={classNames(classes.value, classes.green)}>
                {pipelines.find(pipe => pipe.id === consortium.activePipelineId).name}
              </Typography>
            ) : <Typography className={classNames(classes.value, classes.red)}>None</Typography>
        }
      </div>
    );

    // Add owner/member list
    const ownersIds = consortium.owners.reduce((acc, user) => {
      acc[user] = true;
      return acc;
    }, {});

    const consortiumUsers = consortium.owners
      .map(user => ({ id: user, owner: true, member: true }))
      .concat(
        consortium.members
          .filter(user => !Object.prototype.hasOwnProperty.call(ownersIds, user))
          .map(user => ({ id: user, member: true }))
      );

    const avatars = consortiumUsers
      .filter((v, i, a) => i === a.indexOf(v))
      .map(user => (
        <MemberAvatar
          key={`${user.id}-avatar`}
          consRole={user.owner ? 'Owner' : 'Member'}
          name={user.id}
          showDetails
          width={40}
        />
      ));

    text.push(
      <div key="avatar-container" className={classes.contentContainer}>
        <Typography className={classes.label}>
          Owner(s)/Members:
        </Typography>
        {avatars}
      </div>
    );

    if (owner && consortium.activePipelineId && consortium.isMapped) {
      actions.push(
        <Button
          key={`${consortium.id}-start-pipeline-button`}
          variant="contained"
          color="secondary"
          className={classes.button}
          onClick={this.startPipeline(consortium.id, consortium.activePipelineId)}
        >
          Start Pipeline
        </Button>
      );
    } else if (owner && !consortium.activePipelineId) {
      actions.push(
        <Button
          key={`${consortium.id}-set-active-pipeline-button`}
          component={Link}
          to={`dashboard/consortia/${consortium.id}/1`}
          variant="contained"
          color="secondary"
          className={classes.button}
        >
          Set Active Pipeline
        </Button>
      );
    } else if ((owner || member) && !consortium.isMapped) {
      actions.push(
        <Button
          component={Link}
          to="dashboard/maps"
          variant="contained"
          color="secondary"
          className={classes.button}
          key={`${consortium.id}-set-map-local-button`}
        >
          Map Local Data
        </Button>
      );
    }

    if (member && !owner) {
      actions.push(
        <Button
          key={`${consortium.id}-leave-cons-button`}
          name={`${consortium.name}-leave-cons-button`}
          variant="contained"
          color="secondary"
          className={classes.button}
          onClick={this.leaveConsortium(consortium.id)}
        >
          Leave Consortium
        </Button>
      );
    } else if (!member && !owner && consortium.activePipelineId) {
      actions.push(
        <Button
          key={`${consortium.id}-join-cons-button`}
          name={`${consortium.name}-join-cons-button`}
          variant="contained"
          color="secondary"
          className={classes.button}
          onClick={this.joinConsortium(consortium.id, consortium.activePipelineId)}
        >
          Join Consortium
        </Button>
      );
    }

    return { actions, text, owner };
  }

  getListItem = (consortium) => {
    const { loggedInUser } = this.props;
    return (
      <ListItem
        key={`${consortium.id}-list-item`}
        itemObject={consortium}
        deleteItem={this.openModal}
        owner={isUserA(loggedInUser.id, consortium.owners)}
        itemOptions={
          this.getOptions(
            isUserA(loggedInUser.id, consortium.members),
            isUserA(loggedInUser.id, consortium.owners),
            consortium
          )
        }
        itemRoute="/dashboard/consortia"
      />
    );
  }

  deleteConsortium = () => {
    const { deleteConsortium } = this.props;
    const { consortiumToDelete } = this.state;

    deleteConsortium(consortiumToDelete);
    this.closeModal();
  }

  joinConsortium = (consortiumId, activePipelineId) => () => {
    const { joinConsortium } = this.props;
    joinConsortium(consortiumId, activePipelineId);
  }

  leaveConsortium = consortiumId => () => {
    const { leaveConsortium } = this.props;
    leaveConsortium(consortiumId);
  }

  startPipeline = (consortiumId, activePipelineId) => () => {
    const { startPipeline } = this.props;
    startPipeline(consortiumId, activePipelineId);
  }

  closeModal = () => {
    this.setState({ showModal: false });
  }

  openModal = consortiumId => () => {
    this.setState({
      showModal: true,
      consortiumToDelete: consortiumId,
    });
  }

  render() {
    const { consortia, loggedInUser, classes } = this.props;
    const { showModal } = this.state;

    const {
      memberConsortia,
      otherConsortia,
    } = this.consortiaClassification(consortia, loggedInUser);

    return (
      <div>
        <div className="page-header">
          <Typography variant="h4">
            Consortia
          </Typography>
          <Fab
            color="primary"
            component={Link}
            to="/dashboard/consortia/new"
            className={classes.button}
            name="create-consortium-button"
          >
            <AddIcon />
          </Fab>
        </div>

        {
          consortia && consortia.length && consortia.length > MAX_LENGTH_CONSORTIA
          && consortia.map(consortium => this.getListItem(consortium))
        }
        {memberConsortia.length > 0 && <Typography variant="h6">Member Consortia</Typography>}
        {
          memberConsortia.length > 0
          && memberConsortia.map(consortium => this.getListItem(consortium))
        }
        {otherConsortia.length > 0 && <Typography variant="h6" className={classes.subtitle}>Other Consortia</Typography>}
        {
          otherConsortia.length > 0
          && otherConsortia.map(consortium => this.getListItem(consortium))
        }
        {
          (!consortia || !consortia.length)
          && (
            <Typography variant="body1">
              No consortia found
            </Typography>
          )
        }
        <ListDeleteModal
          close={this.closeModal}
          deleteItem={this.deleteConsortium}
          itemName="consortium"
          show={showModal}
          warningMessage="All pipelines associated with this consortium will also be deleted"
        />
      </div>
    );
  }
}

ConsortiaList.propTypes = {
  loggedInUser: PropTypes.object.isRequired,
  consortia: PropTypes.array.isRequired,
  pipelines: PropTypes.array.isRequired,
  classes: PropTypes.object.isRequired,
  deleteConsortium: PropTypes.func.isRequired,
  joinConsortium: PropTypes.func.isRequired,
  leaveConsortium: PropTypes.func.isRequired,
  startPipeline: PropTypes.func.isRequired,
};

export default withStyles(styles)(ConsortiaList);
