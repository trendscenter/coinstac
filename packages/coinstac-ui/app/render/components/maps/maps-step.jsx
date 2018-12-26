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

    this.handleStep = this.handleStep.bind(this);
  }

  filterGetObj(arr, search) {
     let str = search.toLowerCase();
     return arr.findIndex(function(obj) {
       return Object.keys(obj).some(function(key) {
         let objkey = obj[key];
         if(typeof objkey === 'string'){
           let fuzzy = bitap(objkey, str, 1);
           if(fuzzy.length){
             return true;
           }
         }
       })
     });
   }

  handleStep(step, type, updated) {
    let result = [];
    Object.keys(step).map((key, input) => {
      if (typeof step[key] === 'object') {
         let mapped = -1;
         Object.keys(step[key]).map((k, i) => {
            if(type === 'data') {
              if(this.props.consortium.stepIO[0] && this.props.consortium.stepIO[0].data) {
                mapped = this.filterGetObj(this.props.consortium.stepIO[0].data, step[key][k].type);
              }
              result.push(<MapsStepData isMapped={mapped} getContainers={this.props.getContainers} key={'step-data'+i} step={step[key][k]} type={capitalize(type)} />);
            } else {
              if(this.props.consortium.stepIO[0] && this.props.consortium.stepIO[0].covariates) {
               mapped = this.filterGetObj(this.props.consortium.stepIO[0].covariates, step[key][k].name);
              }
              result.push(<MapsStepCovariate isMapped={mapped} getContainers={this.props.getContainers} key={'step-covariate'+i} step={step[key][k]} type={capitalize(type)} />);
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

    return (
      <div className={classes.section}>
        <Typography variant="h6">
          {name === 'covariates' || name === 'data' ? capitalize(name) : 'Value'}
        </Typography>
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
};

export default withStyles(styles)(MapsStep);
