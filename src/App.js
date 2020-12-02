import React from 'react';
import './App.css';
import { AmplifyAuthenticator, AmplifySignIn } from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import {AppBar, Toolbar, Grid, Paper, Typography, Button, IconButton, Container} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';
import Bits from './Bits';
import BitSorter from './BitSorter';
import EmailEditor from './EmailEditor';
import BitsProvider from './BitsProvider';
import NotificationSystem from 'react-notification-system';
import { Auth } from 'aws-amplify';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    color: theme.palette.text.secondary,
    height: "100%",
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
  const notificationSystem = React.createRef();

  React.useEffect(() => {
      return onAuthUIStateChange((nextAuthState, authData) => {
          setAuthState(nextAuthState);
          setUser(authData)
      });
  }, []);

  const addNotification = function (params) {
    //event.preventDefault();
    const notification = notificationSystem.current;
    notification.addNotification(params);
  };
  
  const signOut = function () {
    try {
        Auth.signOut();
    } catch (error) {
        console.log('error signing out: ', error);
    }
  }

 return authState === AuthState.SignedIn && user ? ( //TODO: remove when done testing
//return 1===1 ? (
  <BitsProvider>
    <div className={classes.root}>
    <NotificationSystem ref={notificationSystem} />
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Bacon Bits
          </Typography>
          <Button color="inherit" onClick={signOut}>Logout</Button>
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
              <BitSorter/>
            </Paper>
          </Grid>
          <Grid item xs>
            <Paper className={classes.paper}>
              <EmailEditor addNotification={addNotification}/>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </div>
  </BitsProvider>
  ) : (
    <AmplifyAuthenticator>
      <AmplifySignIn slot="sign-in" hideSignUp></AmplifySignIn>
    </AmplifyAuthenticator>
);
}

export default App;