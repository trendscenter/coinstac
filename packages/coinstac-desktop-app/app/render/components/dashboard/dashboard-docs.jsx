import { shell } from 'electron';
import React from 'react';
import { useQuery } from '@apollo/client';
import makeStyles from '@material-ui/core/styles/makeStyles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { GET_LATEST_GIT_RELEASE } from '../../state/graphql/functions';

const useStyles = makeStyles(theme => ({
  wrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    position: 'relative',
    border: '1px solid #ccc',
    marginTop: theme.spacing(5),
  },
  divider: {
    position: 'absolute',
    left: 'calc(50% - 0.5px)',
    top: 0,
    height: '100%',
    width: 1,
    backgroundColor: '#ccc',
  },
  doc: {
    padding: theme.spacing(2),
  },
  links: {
    paddingTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  link: {
    textAlign: 'left',
    fontSize: 16,
  },
  version: {
    position: 'relative',
    padding: theme.spacing(2),
  },
  loader: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  },
}));

const LINKS = [
  { url: 'https://trendscenter.github.io/coinstac/end-user-researcher/getting-started', name: 'Getting started' },
  { url: 'https://trendscenter.github.io/coinstac/end-user-researcher/using-coinstac', name: 'Using coinstac' },
  { url: 'https://trendscenter.github.io/coinstac/end-user-researcher/coinstac-first-example', name: 'Coinstac first example' },
  { url: 'https://trendscenter.github.io/coinstac/end-user-researcher/Consortium', name: 'Consortium' },
  { url: 'https://trendscenter.github.io/coinstac/end-user-researcher/computation-list', name: 'Computation list' },
];

const DashboardDocs = () => {
  const classes = useStyles();

  const { loading, data } = useQuery(GET_LATEST_GIT_RELEASE);

  const handleLinkClick = (url) => {
    shell.openExternal(url);
  };

  const releaseData = data?.getLatestGitRelease;

  return (
    <div className={classes.wrapper}>
      <div className={classes.doc}>
        <Typography variant="h6">
          Getting Started Using Coinstac
        </Typography>

        <div className={classes.links}>
          {LINKS.map((link, idx) => (
            <Link
              className={classes.link}
              key={link.name}
              href={link.url}
              component="button"
              onClick={() => handleLinkClick(link.url)}
            >
              {`${idx + 1}. ${link.name}`}
            </Link>
          ))}
        </div>
      </div>

      <div className={classes.divider} />

      <div className={classes.version}>
        {loading && (
          <div className={classes.loader}>
            <CircularProgress size={30} />
          </div>
        )}
        {!loading && releaseData && (
          <>
            <Typography variant="h6">
              {`Version ${releaseData.version} updates`}
            </Typography>
            {releaseData.notes}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardDocs;
