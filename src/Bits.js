//Dear Future Developer:  This component is a mess...please don't judge me.  It really needs to be busted up into smaller components and I apologize -Dave
import React, { Component }  from 'react';
import { API, navItem } from "aws-amplify"
import SortableTree, { toggleExpandedForAll }  from 'react-sortable-tree';
import 'react-sortable-tree/style.css';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { Button, TextField, Dialog, Typography, IconButton, Switch, FormControlLabel, AppBar, Tabs, Tab, Box, List, ListItem, ListItemText, ListItemSecondaryAction  } from '@material-ui/core';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';
import BitsContext from './BitsContext';
import BitEditor from './BitEditor';
import { SkipPrevious, SkipNext, ExpandLess, ExpandMore, Settings, Info, Add, Close, Delete, Bookmark } from '@material-ui/icons';
import CircularProgress from '@material-ui/core/CircularProgress'
import './Bits.css';
import draftToHtml from 'draftjs-to-html';
import { convertToRaw } from 'draft-js';
import moment from 'moment';
import { Auth, Analytics } from 'aws-amplify'
var _ = require('lodash');
const HtmlToReactParser = require('html-to-react').Parser;
const htmlToReactParser = new HtmlToReactParser();
const filter = createFilterOptions();

const apiName = 'baconbitsapi';

const HtmlTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 400,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9'
  }
}))(Tooltip);

const styles = (theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(2),
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  listNode: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
});

const DialogTitle = withStyles(styles)((props) => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <Close />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

const DialogContent = withStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

const DialogActions = withStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1),
  },
}))(MuiDialogActions);

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
}));

export default class Bits extends Component {
  constructor(props) {
    super(props);
 
    this.state = {
      treeData: [
        // { title: 'SES', id: '1', selected: false, children: [{ title: 'SPF', id: '3',  selected: false, data: {content: "<strong>Configuring SPF in SES</strong><p><a href='https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-authentication-spf.html'>https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-authentication-spf.html</a></p>"} }] },
        // { title: 'Pinpoint', id: '2', selected: false, children: [{ title: 'Compliance & Certifications', id: '4',  selected: false, data: {content: "<strong>Pinpoint Compliance and Certifications</strong><p><a href='https://aws.amazon.com/compliance/services-in-scope'>https://aws.amazon.com/compliance/services-in-scope</a></p>"} }] },
      ],
      searchString: "",
      cloudSearchString: "",
      searchFocusIndex: 0,
      searchFoundCount: 0,
      nodeClicked: false,
      selectedNodes:[],
      open: false,
      services:[],
      searchHits: [],
      currBit:{
        service: '',
        category: '',
        name: '',
        content:'',
        internal: "false"
      },
      adding: false,
      editing: false,
      categories: [{title: '2-WAY SMS'},{title: 'COMPLIANCE'}],
      currTab: 0,
      searching: false
    };
  }

  handleTabChange = (event, newValue) => {
    this.setState({ currTab: newValue });
  };

  static contextType = BitsContext;

  handleTreeOnChange = treeData => {
    this.setState({ treeData });
  };

  handleSearchOnChange = e => {
    this.setState({
      searchString: e.target.value
    });
  };

  handleCloudSearchOnChange = (evt)=> {
    this.debouncedSearch(evt.target.value);
  };  

  debouncedSearch = _.debounce(function (query) {
    this.setState({
      searching: true
    })
    API
    .get(apiName, `/bits/search/${query}`)
    .then(response => {
      console.log(response);
      this.setState({
        searchHits: response.hits.hit,
        searching: false
      });
    })
    .catch(error => {
      console.log(error);
      this.setState({
        searching: false
      })
    });
  }, 400);

  handleKeyDown = e => {
    //TODO: For some reason this isn't forcing a search.
    //console.log(e.key);
    if (e.key === 'Enter') {
      this.setState({
        searchString: e.target.value
      });
    }
  };


  handleModalClose = e => {
    this.setState({
      open: false,
      editing: false,
      adding: false
    });
    this.context.clearBitEditorState();
  };

  getQueryVariable(variable)
  {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
      if(pair[0] == variable){return pair[1];}
    }
    return(false);
  }

  fetchBits = () => {

    this.props.toggleLoader();
    API
    .get(apiName, '/bits/')
    .then(response => {
      //console.log(response);

      //Sort and Group...TODO: this is gross...but it works.
      var bits = response;
      
      var tree = [];
      bits.sort((a, b) => (a.service > b.service) ? 1 : (a.service === b.service) ? ((a.category > b.category) ? 1 : -1) : -1 );
      
      
      //Get Unique Services
      var services = []
      var tempServices = _.uniq(_.map(bits, 'service'))
      tempServices.forEach(service => {
        services.push({title: service.toUpperCase()});
      })

      //Get Unique Categories
      var categories = []
      var tempCategories = _.uniq(_.map(bits, 'category'))
      tempCategories.forEach(category => {
        categories.push({title: category.toUpperCase()});
      })

      
      var serviceList = _.groupBy(bits, 'service');
      
      for (var property in serviceList) {
        var serviceNode = {}
        serviceNode.title = property;
        serviceNode.children = [];
        if (serviceList.hasOwnProperty(property)) {
          var children = _.groupBy(serviceList[property], 'category');
          for (var property2 in children) {
            var categoryNode = {};
            categoryNode.title = property2
            categoryNode.children = [];
            if (children.hasOwnProperty(property2)) {
              var items = children[property2]
              items.forEach(element => {
                categoryNode.children.push({
                  title: element.internal === "true" ? element.name + ' (INTERNAL)' : element.name,
                  service: element.service,
                  subtitle:`${element.service} - ${element.category}`,
                  id: element.id,
                  data: element
                });
              })

            }
            serviceNode.children.push(categoryNode);
          }
        }
        tree.push(serviceNode);
      }
      
      this.setState({
        treeData: tree,
        services: services,
        categories: categories
      });

      this.props.toggleLoader();
    })
    .catch(error => {
      console.log(error);
    });
  }

  componentDidMount() {
    Auth.currentAuthenticatedUser()
    .then(user => {
      this.context.setUser(user);
    })
    .catch(err => console.log(err));

    //We have a search value in querystring...let's search.
    var searchString = this.getQueryVariable("search")
    if (searchString){
      API
      .get(apiName, `/bits/search/${searchString}`)
      .then(response => {
        console.log(response);
        this.setState({
          searchHits: response.hits.hit
        });
      })
      .catch(error => {
        console.log(error);
      });
    }

    this.fetchBits()
  }

  selectPrevMatch = () => {
    const { searchFocusIndex, searchFoundCount } = this.state;

    this.setState({
      searchFocusIndex:
        searchFocusIndex !== null
          ? (searchFoundCount + searchFocusIndex - 1) % searchFoundCount
          : searchFoundCount - 1
    });
  };

  selectNextMatch = () => {
    const { searchFocusIndex, searchFoundCount } = this.state;

    this.setState({
      searchFocusIndex:
        searchFocusIndex !== null
          ? (searchFocusIndex + 1) % searchFoundCount
          : 0
    });
  };

  toggleNodeExpansion = expanded => {
    this.setState(prevState => ({
      treeData: toggleExpandedForAll({ treeData: prevState.treeData, expanded })
    }));
  };

  handleSettingsClick = (node) => {
    //console.log(this.context.alias);
    var self = this;

    this.props.toggleLoader();

    API
    .get(apiName, `/bits/object/${node.node.id}/${node.node.service}`)
    .then(response => {
      //console.log(response);
      this.context.setBitEditorStateFromHTML(response.content);
      this.setState({
        currBit: response,
        modalTitle: "Edit Bacon Bit",
        editing: true,
        open: true
      });
      this.props.toggleLoader();
    })
    .catch(error => {
      console.log(error);
      self.props.addNotification({
        message: 'Error fetching Bit...Check Console',
        level: 'error'
      });
      this.props.toggleLoader();
    });
  };

  handleServiceChange = (event) => {
    //console.log('handleServiceChange',event.target.value);
    var currBit = this.state.currBit;
    currBit.service = event.target.value
    this.setState({
      currBit
    });
  };

  handleService2Change = (event, newValue) => {
    var tempValue = ''
    if (typeof newValue === 'string') {
      tempValue = newValue
    } else if (newValue && newValue.inputValue) {
      tempValue = newValue.inputValue
    } else if (newValue && newValue.title) {
      tempValue = newValue.title
    }
    console.log('New Service: ',tempValue)
    var currBit = this.state.currBit;
    currBit.service = tempValue.toUpperCase();
    this.setState({
      currBit
    });
  };
  handleCategoryChange = (event) => {
    //console.log('handleCategoryChange',event.target.value);
    var currBit = this.state.currBit;
    currBit.category = event.target.value
    this.setState({
      currBit
    });
  };

  handleCategory2Change = (event, newValue) => {
    var tempValue = ''
    if (typeof newValue === 'string') {
      tempValue = newValue
    } else if (newValue && newValue.inputValue) {
      tempValue = newValue.inputValue
    } else if (newValue && newValue.title) {
      tempValue = newValue.title
    }
    console.log('New Category: ',tempValue)
    var currBit = this.state.currBit;
    currBit.category = tempValue.toUpperCase();
    this.setState({
      currBit
    });
  };

  toggleInternal = (event) => {
    var currBit = this.state.currBit;
    if (currBit.internal === "true") currBit.internal = "false"
    else currBit.internal = "false"
    this.setState({
      currBit
    });
  };

  handleTitleChange = (event) => {
    //console.log('handleTitleChange',event.target.value);
    var currBit = this.state.currBit;
    currBit.name = event.target.value
    this.setState({
      currBit
    });
  };

  handleAddClick = () => {
    console.log('Add Bit');
    this.context.clearBitEditorState();
    this.setState({
      modalTitle: "New Bacon Bit",
      adding: true,
      open: true,
      currBit:{
        service: '',
        category: '',
        name: '',
        content:'',
        internal: "false"
      }
    });
  };

  handleCreateLinkClick = (id) => {
    console.log('handleCreateLinkClick: ', id);
    var self = this;

    var link = `${window.location.origin}?search=${id}`;

    navigator.clipboard.writeText(link).then(
      () => {
        self.props.addNotification({
          message: 'Copied Link to Clipboard',
          level: 'success'
        });
      },
      error => {
        self.props.addNotification({
          message: 'There was an error copying Link to clipboard',
          level: 'error'
        });
      }
    );
  };

  handleDeleteClick = (node) => {
    console.log('Delete Bit');
    var self = this;

    this.props.addNotification({
    message: 'Are you sure you want to delete this Bacon Bit?',
    level: 'warning',
    action: {
        label: 'OK',
        callback: function() {
          self.handleDeleteConfirmClick(node);
        }
      }
    });
  };

  handleDeleteConfirmClick = (node) => {
    console.log('Delete Confirmed!', node);
    this.props.toggleLoader();
    var self = this;
    API
      .del(apiName, `/bits/object/${node.node.id}/${node.node.service}`)
      .then(response => {
        this.props.toggleLoader();
        this.fetchBits();
        self.props.addNotification({
          message: 'Bit Deleted',
          level: 'success'
        });
      })
      .catch(error => {
        console.log(error);
        self.props.addNotification({
          message: 'Error deleting Bit...Check Console',
          level: 'error'
        });
        this.props.toggleLoader();
      });
  }

  handleModalSave = () => {
    
    var self = this;
    const rawContentState = convertToRaw(this.context.bitEditorState.getCurrentContent());
    const html = draftToHtml(rawContentState);
    //console.log(html);

    var currBit = this.state.currBit
    currBit.content = html

    if(!currBit.service || !currBit.category || !currBit.name){
      self.props.addNotification({
        message: 'All fields are required, please provide a value for Service, Category, and Title.',
        level: 'warning'
      });
      return;
    }

    this.props.toggleLoader();

    if (this.state.adding){
      currBit.created = moment().format();
      currBit.createdBy = this.context.alias;
      currBit.modified = moment().format();
      currBit.modifiedBy = this.context.alias;
    } else if(this.state.editing){
      currBit.modified = moment().format();
      currBit.modifiedBy = this.context.alias;
    }
      API
      .put(apiName, `/bits/`, {body: currBit})
      .then(response => {
        this.setState({
          open: false,
          editing: false,
          adding: false
        });
        this.props.toggleLoader();
        this.fetchBits()
        self.props.addNotification({
          message: 'Bit Saved!',
          level: 'success'
        });
      })
      .catch(error => {
        console.log(error);
        this.setState({
          open: false,
          editing: false,
          adding: false
        });
        this.props.toggleLoader();
        self.props.addNotification({
          message: 'Error saving Bit...Check Console',
          level: 'error'
        });
      });


  };

  handleHitClick = (hit) => {
    //Need to remap CloudSearch arrays to just strings
    console.log(hit);
    var node = {
      id: hit.id[0],
      selected: false,
      service: hit.service[0],
      subtitle: `${hit.service[0]} - ${hit.category[0]}`,
      title: hit.internal && hit.internal[0] === "true" ? hit.name[0] + ' (INTERNAL)' : hit.name[0],
      expanded: false,
      data:{
        category: hit.category[0],
        content: hit.content[0],
        id: hit.id[0],
        name: hit.name[0],
        service: hit.service[0],
        internal: hit.internal && hit.internal[0],
        createdby: hit.createdby && hit.createdby[0] ? hit.createdby[0] : "",
        modifiedby: hit.modifiedby && hit.modifiedby[0] ? hit.modifiedby[0] : ""
      }
    }

    this.handleNodeClick(node);
  }

  handleNodeClick = (node) => {
    if(!node.children){ //No Selecting Root Nodes
      const context = this.context;
      var selectedBits = context.selectedBits;

      var found = false
      selectedBits.forEach(bit => {
        if (bit.id === node.id){
          found = true;
        }
      });

      if (!found) {
        //add to selected
        selectedBits.push(node);
    
        Analytics.record( 
          {
            name: 'bitSelected' , 
            'Endpoint' : this.context.user,
            attributes:{
              bitId: node.id, 
              Timestamp: new Date().toISOString(), 
              ChannelType: 'EMAIL', 
              Address: this.context.user
            },
        }); 

        if (node.data && node.data.internal === "true"){
          this.props.addNotification({
            message: 'You selected a bit with Internal content. Proceed with caution!',
            level: 'warning'
          });
        }
        context.setSelectedBits(selectedBits);
      }
      
    }
  };

  render() {
    const {
      treeData,
      searchString,
      searchFocusIndex,
      searchFoundCount,
      open,
      modalTitle,
      currBit,
      categories,
      services,
      currTab,
      searchHits,
      searching
    } = this.state;

    const customSearchMethod = ({  node, path, treeIndex, searchQuery }) => {
      //return false;
      return searchQuery && 
      node.data && 
      (node.title.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1 ||
      node.data.content.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1);
    }

    const ButtonInTabs = ({ className, onClick, children }) => {
      return <Button className={className} style={{color: "white"}} onClick={onClick} children={children} />;
    };

    const SpinnerAdornment = withStyles(styles)(props => (
      <CircularProgress
        className={props.classes.spinner}
        style={{marginLeft: "10px",marginTop: "10px"}}
        size={20}
      />
    ))
    
    return (
      <div>
      <AppBar position="static">
        <Tabs value={currTab} onChange={this.handleTabChange} aria-label="simple tabs example">
          <Tab label="Search" {...a11yProps(0)} />
          <Tab label="Browse" {...a11yProps(1)} />
          {this.context.isAdmin ? (
            <ButtonInTabs onClick={() => this.handleAddClick(false)}>
              <Add color="secondary" />
              New Bacon Bit
            </ButtonInTabs>
          ) : (null)}
        </Tabs>
      </AppBar>
      <TabPanel value={currTab} index={0}>
        <TextField size="small" placeholder="Search..." variant="outlined" fullWidth style={{width: "90%"}} onChange={this.handleCloudSearchOnChange} />
        {searching && <SpinnerAdornment/>}
     
          <List dense={true}>
            {searchHits.map((value) => {
              const labelId = `list-label-${value.id}`;
              //Dear Future Dave: you need to figure out how to convert all Search Hits, to a node while converting dumb string arrays to strings
              return (
                <ListItem key={value.id} role={undefined} dense button  onClick={() => this.handleHitClick(value.fields)} className={value.fields.internal && value.fields.internal[0] === "true" ? 'internalNode' : ''}>
                  <ListItemText id={labelId} primary={ value.fields.internal && value.fields.internal[0] === "true" ? value.fields.name[0] + ' (INTERNAL)' : value.fields.name[0]  } secondary={`${value.fields.service[0]} - ${value.fields.category[0]}`} />
                  <ListItemSecondaryAction>
                      {this.context.isAdmin ? (
                          <button
                            className="btn btn-outline-success"
                            title="Delete Bacon Bit"
                            style={{
                              verticalAlign: "middle"
                            }}
                            onClick={() => this.handleDeleteClick({node: value.fields})}
                          >
                            <Delete fontSize="small" color="error"/>
                          </button>
                      ) : (null)}
                      {this.context.isAdmin ? (
                              <button
                                className="btn btn-outline-success"
                                title="Edit Bacon Bit"
                                style={{
                                  verticalAlign: "middle",
                                  marginLeft: "5px"
                                }}
                                onClick={() => this.handleSettingsClick({node: value.fields})}
                              >
                                <Settings fontSize="small" color="primary"/>
                              </button>
                      ) : (null)}
                      <button
                            className="btn btn-outline-success"
                            title="Copy Link"
                            style={{
                              verticalAlign: "middle",
                              marginLeft: "5px"
                            }}
                            onClick={() => this.handleCreateLinkClick(value.fields.id[0])}
                          >
                            <Bookmark fontSize="small" color="primary"/>
                      </button>
                      <HtmlTooltip
                            title={
                              <React.Fragment>
                                {htmlToReactParser.parse(`${value.fields.content[0]}<span style="font-size:10px;color:#505050"><hr />Created By: ${value.fields.createdby && value.fields.createdby[0] ? value.fields.createdby[0] : ''} Last Modified By: ${value.fields.modifiedby && value.fields.modifiedby[0] ? value.fields.modifiedby[0] : ''}</span>`)}
                              </React.Fragment>
                            }
                            interactive
                            arrow
                            placement="right"
                          >
                            <button
                              className="btn btn-outline-success"
                              style={{
                                verticalAlign: "middle",
                                marginLeft: "5px"
                              }}
                            >
                              <Info fontSize="small" color="primary"/>
                            </button>
                        </HtmlTooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
      </TabPanel>
      <TabPanel value={currTab} index={1}>
        <div>
          <div className="bar-wrapper">
            <TextField size="small" placeholder="search" variant="outlined"  onChange={this.handleSearchOnChange} onKeyDown={this.handleKeyDown} />
            <Button variant="contained" className="previous" title="Previous Search result" onClick={this.selectPrevMatch}>
              <SkipPrevious />
            </Button>
            <Button variant="contained" className="next" title="Next Search result" onClick={this.selectNextMatch}>
              <SkipNext />
            </Button>
            <Button variant="contained" className="expand" title="Expand" onClick={this.toggleNodeExpansion.bind(this, true)}>
              <ExpandMore />
            </Button>
            <Button
              className="collapse" variant="contained" title="Collapse" 
              onClick={this.toggleNodeExpansion.bind(this, false)}
            >
              <ExpandLess />
            </Button>
          </div>
          <div className="tree-wrapper">
            <SortableTree
              treeData={treeData}
              onlyExpandSearchedNodes={true}
              scaffoldBlockPxWidth={25}
              rowHeight={60}
              canDrag={false}
              onChange={this.handleTreeOnChange}
              searchQuery={searchString}
              searchMethod={customSearchMethod}
              searchFocusOffset={searchFocusIndex}
              searchFinishCallback={matches =>
                this.setState({
                  searchFoundCount: matches.length,
                  searchFocusIndex:
                    matches.length > 0 ? searchFocusIndex % matches.length : 0
                })
              }
              generateNodeProps={(rowInfo) => {
                const { node } = rowInfo;
                return {
                  buttons: [
                    node.data ? (
                      <div>
                        {this.context.isAdmin ? (
                          <button
                            className="btn btn-outline-success"
                            title="Delete Bacon Bit"
                            style={{
                              verticalAlign: "middle"
                            }}
                            onClick={() => this.handleDeleteClick(rowInfo)}
                          >
                            <Delete fontSize="small" color="error"/>
                          </button>
                        ) : (null)}
                        {this.context.isAdmin ? (
                          <button
                            className="btn btn-outline-success"
                            title="Edit Bacon Bit"
                            style={{
                              verticalAlign: "middle",
                              marginLeft: "5px"
                            }}
                            onClick={() => this.handleSettingsClick(rowInfo)}
                          >
                            <Settings fontSize="small" color="primary"/>
                          </button>
                        ) : (null)}
                        <HtmlTooltip
                          title={
                            <React.Fragment>
                              {htmlToReactParser.parse(`${node.data.content}<span style="font-size:10px;color:#505050"><hr />Created By: ${node.data.createdBy || ''} Last Modified By: ${node.data.modifiedBy || ''}</span>`)}
                            </React.Fragment>
                          }
                          interactive
                          arrow
                          placement="right"
                        >
                          <button
                            className="btn btn-outline-success"
                            style={{
                              verticalAlign: "middle",
                              marginLeft: "5px"
                            }}
                          >
                            <Info fontSize="small" color="primary"/>
                          </button>
                        </HtmlTooltip>
                      </div>
                    ) :
                    (
                      null
                    )
                  ],
                  onClick: (event) => {
                    if(typeof(event.target.className) === 'object') {
                      // Ignore the onlick, or do something different as the (+) or (-) button has been clicked.
                    }
                    else {
                      this.handleNodeClick(node);
                    }
                  },
                  style:
                      node.data && node.data.internal === "true"
                        ? {
                            color: "red"
                          }
                        : {}
                };
              }}
              isVirtualized={true}
            />
          </div>
          
        </div>
      </TabPanel>
      <Dialog onClose={this.handleModalClose} aria-labelledby="customized-dialog-title" open={open}>
        <DialogTitle id="customized-dialog-title" onClose={this.handleModalClose}>
          {modalTitle}
        </DialogTitle>
        <DialogContent dividers>
          {/* <FormControl className="formControl">
            <InputLabel id="demo-simple-select-label">Service</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="select-service"
              value={currBit.service}
              onChange={this.handleServiceChange}
            >
              {services}
            </Select>
          </FormControl> */}

          <Autocomplete
            value={currBit.service}
            onChange={this.handleService2Change}
            filterOptions={(options, params) => {
              const filtered = filter(options, params);

              // Suggest the creation of a new value
              if (params.inputValue !== '') {
                filtered.push({
                  inputValue: params.inputValue,
                  title: `Add "${params.inputValue}"`,
                });
              }

              return filtered;
            }}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            id="service-autocomplete"
            options={services}
            getOptionLabel={(option) => {
              // Value selected with enter, right from the input
              if (typeof option === 'string') {
                return option;
              }
              // Add "xxx" option created dynamically
              if (option.inputValue) {
                return option.inputValue;
              }
              // Regular option
              return option.title;
            }}
            renderOption={(option) => option.title}
            freeSolo
            renderInput={(params) => (
              <TextField {...params} label="Service *" />
            )}
          />

          {/* <TextField className="formControl" id="input-category" label="Category" value={currBit.category} onChange={this.handleCategoryChange} /> */}
          
          <Autocomplete
            value={currBit.category}
            onChange={this.handleCategory2Change}
            filterOptions={(options, params) => {
              const filtered = filter(options, params);

              // Suggest the creation of a new value
              if (params.inputValue !== '') {
                filtered.push({
                  inputValue: params.inputValue,
                  title: `Add "${params.inputValue}"`,
                });
              }

              return filtered;
            }}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            id="free-solo-with-text-demo"
            options={categories}
            getOptionLabel={(option) => {
              // Value selected with enter, right from the input
              if (typeof option === 'string') {
                return option;
              }
              // Add "xxx" option created dynamically
              if (option.inputValue) {
                return option.inputValue;
              }
              // Regular option
              return option.title;
            }}
            renderOption={(option) => option.title}
            freeSolo
            renderInput={(params) => (
              <TextField {...params} label="Category *" />
            )}
          />
          
          <TextField className="formControl" id="input-title" label="Title *" value={currBit.name} onChange={this.handleTitleChange} />
          <FormControlLabel
            control={<Switch checked={currBit.internal === "true"} onChange={this.toggleInternal} />}
            label="Internal Only"
          />
          <BitEditor/>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={this.handleModalSave} color="primary">
            Save changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
      
    );
  }
}
