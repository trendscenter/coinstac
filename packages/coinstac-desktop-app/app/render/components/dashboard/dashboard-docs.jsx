import { useQuery } from '@apollo/client';
import makeStyles from '@material-ui/core/styles/makeStyles';
import CircularProgress from '@material-ui/core/CircularProgress';
import Divider from '@material-ui/core/Divider';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { shell } from 'electron';
import moment from 'moment';
import React, { useMemo } from 'react';
import { GET_LATEST_GIT_RELEASE } from '../../state/graphql/functions';

const useStyles = makeStyles(theme => ({
  wrapper: {
    display: 'flex',
    position: 'relative',
    marginTop: theme.spacing(5),
    border: `1px solid ${theme.palette.grey[300]}`,
  },
  doc: {
    padding: theme.spacing(2),
    paddingRight: theme.spacing(4),
    borderRight: `1px solid ${theme.palette.grey[300]}`,
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
  releaseInfo: {
    flex: 1,
    position: 'relative',
    padding: theme.spacing(2),
    paddingLeft: theme.spacing(4),
  },
  versionLink: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.palette.common.black,
  },
  authorInfo: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    color: theme.palette.grey[700],
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 20,
  },
  authorLink: {
    color: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'bold',
  },
  logsTitle: {
    marginTop: theme.spacing(2),
  },
  logsList: {
    paddingLeft: theme.spacing(2),
    fontSize: 16,
  },
  log: {
    display: 'flex',
    alignItems: 'center',
  },
  prAuthorLink: {
    color: theme.palette.common.black,
    fontSize: 'inherit',
    fontWeight: 'bold',
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
  },
  prLink: {
    fontSize: 'inherit',
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
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

  const releaseLogs = useMemo(() => {
    if (!releaseData?.body) {
      return [];
    }

    const logs = releaseData.body.split('\r\n').slice(1).filter(Boolean).map((log) => {
      const regex = /^\*\s(.+)\sby\s@(.+)\sin\s(.+)$/gm;
      const logPattern = regex.exec(log);

      if (!logPattern) {
        return '';
      }

      const message = logPattern[1];
      const author = logPattern[2];
      const link = logPattern[3];

      if (!message || !author || !link) {
        return '';
      }

      const idRegex = /\/(\d+)$/gm;
      const idPattern = idRegex.exec(link);

      const id = idPattern[1];

      if (!idPattern[1]) {
        return '';
      }

      return {
        message,
        author,
        link,
        id,
      };
    })
      .filter(Boolean);
    return logs;
  }, [releaseData]);

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

      <div className={classes.releaseInfo}>
        {loading && (
          <div className={classes.loader}>
            <CircularProgress size={30} />
          </div>
        )}
        {!loading && releaseData && (
          <>
            <Typography variant="h6">
              <Link
                className={classes.versionLink}
                href={releaseData.html_url}
                component="button"
                onClick={() => handleLinkClick(releaseData.html_url)}
              >
                {releaseData.tag_name}
              </Link>
            </Typography>

            <div className={classes.authorInfo}>
              <img
                className={classes.authorAvatar}
                src={releaseData.author.avatar_url}
                alt={releaseData.author.login}
              />
              &nbsp;
              <Link
                className={classes.authorLink}
                href={releaseData.author.html_url}
                component="button"
                onClick={() => handleLinkClick(releaseData.author.html_url)}
              >
                {releaseData.author.login}
              </Link>
              &nbsp;released this&nbsp;
              {moment(releaseData.published_at).format('MMM D, YYYY')}
            </div>
            <Divider />
            <Typography variant="h6" className={classes.logsTitle}>
              What&apos;s Changed
            </Typography>
            <Divider />
            {releaseLogs.length > 0 && (
              <ul className={classes.logsList}>
                {releaseLogs.map(log => (
                  <li key={log.id}>
                    <div className={classes.log}>
                      {log.message}
                      &nbsp;by&nbsp;
                      <Link
                        className={classes.prAuthorLink}
                        href={`https://github.com/${log.author}`}
                        component="button"
                        onClick={() => handleLinkClick(`https://github.com/${log.author}`)}
                      >
                        {`@${log.author}`}
                      </Link>
                      &nbsp;in&nbsp;
                      <Link
                        className={classes.prLink}
                        href={`https://github.com/${log.link}`}
                        component="button"
                        onClick={() => handleLinkClick(log.link)}
                      >
                        {`#${log.id}`}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {!loading && !releaseData && (
          <Typography variant="h6">
            Failed to get release information
          </Typography>
        )}
      </div>
    </div>
  );
};

export default DashboardDocs;
