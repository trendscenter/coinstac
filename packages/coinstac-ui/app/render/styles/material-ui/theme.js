import { createMuiTheme } from '@material-ui/core/styles';

const palette = {
  primary: { main: '#3F6D87' },
  secondary: { main: '#f05a29' },
};
const themeName = 'Coinstac';

export default createMuiTheme({
  themeName,
  palette,
  overrides: {
    MuiTableCell: {
      root: {
        padding: '8px',
      },
    },
  },
});
