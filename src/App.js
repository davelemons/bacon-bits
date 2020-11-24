import React from 'react';
import './App.css';
import { AmplifyAuthenticator, AmplifySignIn } from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import {AppBar, Toolbar, Grid, Paper, Typography, Button, IconButton, Container} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';
import Bits from './Bits';
import MyProvider from './MyProvider';
import MyContext from './MyContext';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  container: {
    paddingTop: '10px',
  }
}));

function App() {
  const classes = useStyles();
  const [authState, setAuthState] = React.useState();
  const [user, setUser] = React.useState();

  React.useEffect(() => {
      return onAuthUIStateChange((nextAuthState, authData) => {
          setAuthState(nextAuthState);
          setUser(authData)
      });
  }, []);

return authState === AuthState.SignedIn && user ? (
  <MyProvider>
    <div className={classes.root}>

      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Bacon Bits
          </Typography>
          <Button color="inherit">Logout</Button>
        </Toolbar>
      </AppBar>
      {/* <div>Hello, {user.username}</div> */}
      <Container className={classes.container} maxWidth="xl">
        <Grid container spacing={3}>
          <Grid item xs>
            <Paper className={classes.paper}>
              <Bits />
            </Paper>
          </Grid>
          <Grid item xs>
            <Paper className={classes.paper}>
              <MyContext.Consumer>
              {context => (
                context.selectedBits.map(bit => (
                  <div>
                    {bit}
                  </div>
                ))
              )}
              </MyContext.Consumer>
            </Paper>
          </Grid>
          <Grid item xs>
            <Paper className={classes.paper}>xs</Paper>
          </Grid>
        </Grid>
      </Container>
    </div>
  </MyProvider>
  ) : (
    <AmplifyAuthenticator>
      <AmplifySignIn slot="sign-in" hideSignUp></AmplifySignIn>
    </AmplifyAuthenticator>
);
}

export default App;