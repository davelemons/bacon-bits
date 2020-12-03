import React, { Component }  from 'react';
import { API } from "aws-amplify"
import SortableTree, { toggleExpandedForAll }  from 'react-sortable-tree';
import 'react-sortable-tree/style.css';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { Button, TextField, Dialog, Typography, IconButton, InputLabel, FormControl, Select, MenuItem  } from '@material-ui/core';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import Tooltip from '@material-ui/core/Tooltip';
import BitsContext from './BitsContext';
import { SkipPrevious, SkipNext, ExpandLess, ExpandMore, Settings, Info, Add, Close } from '@material-ui/icons';
import './Bits.css';
const HtmlToReactParser = require('html-to-react').Parser;
const htmlToReactParser = new HtmlToReactParser();

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

export default class Bits extends Component {
  constructor(props) {
    super(props);
 
    this.state = {
      treeData: [
        { title: 'SES', id: '1', selected: false, children: [{ title: 'SPF', id: '3',  selected: false, data: {content: "<strong>Configuring SPF in SES</strong><p><a href='https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-authentication-spf.html'>https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-authentication-spf.html</a></p>"} }] },
        { title: 'Pinpoint', id: '2', selected: false, children: [{ title: 'Compliance & Certifications', id: '4',  selected: false, data: {content: "<strong>Pinpoint Compliance and Certifications</strong><p><a href='https://aws.amazon.com/compliance/services-in-scope'>https://aws.amazon.com/compliance/services-in-scope</a></p>"} }] },
      ],
      searchString: "",
      searchFocusIndex: 0,
      searchFoundCount: 0,
      nodeClicked: false,
      selectedNodes:[],
      open: false,
      services:[],
      currBit:{
        service: '',
        category: '',
        name: '',
        content:''
      }
    };
  }
  

  static contextType = BitsContext;

  handleTreeOnChange = treeData => {
    this.setState({ treeData });
  };

  handleSearchOnChange = e => {
    this.setState({
      searchString: e.target.value
    });
  };

  handleModalClose = e => {
    this.setState({
      open: false
    });
  };

  componentDidMount() {
    API
    .get(apiName, '/bits/')
    .then(response => {
      console.log(response);

      //Sort
      var bits = response;
      bits.sort((a, b) => (a.service > b.service) ? 1 : (a.service === b.service) ? ((a.category > b.category) ? 1 : -1) : -1 );
      console.log(bits);

      var newTreeData = [];
      var currService = '';
      var tempBit = {};

      bits.forEach(element => {
        if(element.service !== currService){
          //New Service
          
          tempBit = {};
          tempBit.title = element.service;
          tempBit.id = element.id;
          //tempBit.data = element;
          tempBit.children = [];
          tempBit.children.push({
            title:element.category,
            service: element.service,
            id: element.id,
            data: element
          });
          newTreeData.push(tempBit)
          currService = element.service;
        } else {
          tempBit.children.push({
            title:element.category,
            service: element.service,
            id: element.id,
            data: element
          });
        }
        
      });
      console.log(newTreeData);
      this.setState({
        treeData: newTreeData
      });
    })
    .catch(error => {
      console.log(error);
    });

    API
    .get(apiName, '/bits/services/')
    .then(response => {
      console.log(response);
      this.setState({
        services: response,
      });
    })
    .catch(error => {
      console.log(error);
    });
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
    console.log('Dave',node);

    API
    .get(apiName, `/bits/object/${node.node.id}/${node.node.service}`)
    .then(response => {
      console.log(response);
      this.setState({
        currBit: response,
        modalTitle: "Edit Bacon Bit",
        open: true
      });
    })
    .catch(error => {
      console.log(error);
    });
  };

  handleServiceChange = (event) => {
    console.log('handleServiceChange',event.target.value);
    var currBit = this.state.currBit;
    currBit.service = event.target.value
    this.setState({
      currBit
    });
  };

  handleCategoryChange = (event) => {
    console.log('handleCategoryChange',event.target.value);
    var currBit = this.state.currBit;
    currBit.category = event.target.value
    this.setState({
      currBit
    });
  };

  handleTitleChange = (event) => {
    console.log('handleTitleChange',event.target.value);
    var currBit = this.state.currBit;
    currBit.title = event.target.value
    this.setState({
      currBit
    });
  };

  handleAddClick = () => {
    console.log('Add Bit');
    this.setState({
      modalTitle: "New Bacon Bit",
      open: true,
      currBit:{
        service: '',
        category: '',
        name: '',
        content:''
      }
    });
  };

  handleNodeClick = (node) => {
    if(!node.children){ //No Selecting Root Nodes
      const context = this.context;
      var selectedBits = context.selectedBits;
      console.log(node);
      if (node.selected) {
        //Remove from selected
        selectedBits = selectedBits.filter(function(item) {
          return item.id !== node.id;
        });
        node.selected = false;
      } else {
        //add to selected
        selectedBits.push(node);
        node.selected = true;
      }

      context.setSelectedBits(selectedBits);
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
      currBit
    } = this.state;

    const customSearchMethod = ({  node, path, treeIndex, searchQuery }) => {
      //return false;
      return searchQuery && 
      node.data && 
      (node.title.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1 ||
      node.data.content.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1);
    }

    const services = this.state.services.map((service) =>
        <MenuItem value={service}>{service}</MenuItem>
    );
    
    return (
      <div>
        <div className="bar-wrapper">
          <TextField size="small" placeholder="search" variant="outlined"  onChange={this.handleSearchOnChange} />
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
          <Button
            className="addBit" variant="contained" title="Add New Bacon Bit" 
            onClick={this.handleAddClick.bind(this, false)}
          >
            <Add />
          </Button>
        </div>
        <div className="tree-wrapper">
          <SortableTree
            treeData={treeData}
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
                      <button
                        className="btn btn-outline-success"
                        title="Edit Bacon Bit"
                        style={{
                          verticalAlign: "middle"
                        }}
                        onClick={() => this.handleSettingsClick(rowInfo)}
                      >
                        <Settings fontSize="small" color="primary"/>
                      </button>
                      <HtmlTooltip
                        title={
                          <React.Fragment>
                            {htmlToReactParser.parse(node.data.content)}
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
                  node.selected
                    ? {
                        border: "4px solid #707070"
                      }
                    : {}
              };
            }}
            isVirtualized={true}
          />
        </div>
        <Dialog onClose={this.handleModalClose} aria-labelledby="customized-dialog-title" open={open}>
          <DialogTitle id="customized-dialog-title" onClose={this.handleModalClose}>
            {modalTitle}
          </DialogTitle>
          <DialogContent dividers>
            <FormControl className="formControl">
              <InputLabel id="demo-simple-select-label">Service</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="select-service"
                value={currBit.service}
                onChange={this.handleServiceChange}
              >
                {services}
              </Select>
            </FormControl>
            <TextField className="formControl" id="input-category" label="Category" value={currBit.category} onChange={this.handleCategoryChange} />
            <TextField className="formControl" id="input-title" label="Title" value={currBit.name} onChange={this.handleTitleChange} />
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={this.handleModalClose} color="primary">
              Save changes
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}
