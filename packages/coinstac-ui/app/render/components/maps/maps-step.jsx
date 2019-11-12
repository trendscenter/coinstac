import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import bitap from 'bitap';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import MapsStepData from './maps-step-data';
import MapsStepCovariate from './maps-step-covariate';
import MapsStepValue from './maps-step-value';

const styles = theme => ({
  section: {
    marginBottom: theme.spacing.unit * 2,
  },
});

class MapsStep extends Component {
  constructor(props) {
    super(props);

    this.state = {
      contChildren: 0,
    };

    this.handleStep = this.handleStep.bind(this);
  }

  handleStep(step, type) {
    let result = [];
    Object.keys(step).map((key, input) => {
      if (typeof step[key] === 'object' && type.includes('options') === false) {
         let column = null;
         Object.keys(step[key]).map((k, i) => {
            if(type === 'data') {
              if(this.props.consortium.stepIO[0]['data'][k] &&
                this.props.consortium.stepIO[0]['data'][k]['column']){
                column = this.props.consortium.stepIO[0]['data'][k]['column'];
              }
              result.push(
                <MapsStepData
                  getContainers={this.props.getContainers}
                  key={'step-data-'+i+'-'+type}
                  step={step[key][k]}
                  type={type}
                  index={k}
                  column={column}
                  removeMapStep={this.props.removeMapStep}
                  rowArray={this.props.rowArray}
                  setRowArray={this.props.setRowArray}
                />
              );
              column = null;
            } else {
              if(this.props.consortium.stepIO[0]['covariates'][k] &&
                this.props.consortium.stepIO[0]['covariates'][k]['column']){
                column = this.props.consortium.stepIO[0]['covariates'][k]['column'];
              }
              result.push(
                <MapsStepCovariate
                  getContainers={this.props.getContainers}
                  key={'step-cov-'+i+'-'+type}
                  step={step[key][k]}
                  type={type}
                  index={k}
                  column={column}
                  removeMapStep={this.props.removeMapStep}
                  rowArray={this.props.rowArray}
                  setRowArray={this.props.setRowArray}
                />
              );
              column = null;
            }
         });
      } else {
        result.push(<MapsStepValue step={step} key={'step-'+input} type={type} />);
      }
    });
    return result;
  }

  render() {
    const {
      name,
      step,
      classes,
    } = this.props;

    let showName = false;

    if(name === 'covariates' || name === 'data'){
      showName = true;
    }

    return (
      <div className={classes.section}>
        {!showName ?
          <Typography variant="h6">Options</Typography> :
          <Typography variant="h6">{capitalize(name)}</Typography>
        }
        <div ref="Steps">
          {this.handleStep(step, name)}
        </div>
      </div>
    );
  }
}

MapsStep.propTypes = {
  consortium: PropTypes.object.isRequired,
  getContainers: PropTypes.func.isRequired,
  step: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  updateConsortiumClientProps: PropTypes.func.isRequired,
};

export default withStyles(styles)(MapsStep);
