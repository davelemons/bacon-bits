import React, { Component }  from 'react';
import { API } from "aws-amplify"
import SortableTree, { toggleExpandedForAll }  from 'react-sortable-tree';
import 'react-sortable-tree/style.css';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { Button, TextField, Dialog, Typography, IconButton, InputLabel, FormControl, Select, MenuItem  } from '@material-ui/core';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import Tooltip from '@material-ui/core/Tooltip';
import BitsContext from './BitsContext';
import BitEditor from './BitEditor';
import { SkipPrevious, SkipNext, ExpandLess, ExpandMore, Settings, Info, Add, Close, Delete } from '@material-ui/icons';
import './Bits.css';
import draftToHtml from 'draftjs-to-html';
import { convertToRaw } from 'draft-js';
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
        // { title: 'SES', id: '1', selected: false, children: [{ title: 'SPF', id: '3',  selected: false, data: {content: "<strong>Configuring SPF in SES</strong><p><a href='https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-authentication-spf.html'>https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-authentication-spf.html</a></p>"} }] },
        // { title: 'Pinpoint', id: '2', selected: false, children: [{ title: 'Compliance & Certifications', id: '4',  selected: false, data: {content: "<strong>Pinpoint Compliance and Certifications</strong><p><a href='https://aws.amazon.com/compliance/services-in-scope'>https://aws.amazon.com/compliance/services-in-scope</a></p>"} }] },
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
      },
      adding: false,
      editing: false,
      categories: [{title: '2-WAY SMS'},{title: 'COMPLIANCE'}]
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
      open: false,
      editing: false,
      adding: false
    });
    this.context.clearBitEditorState();
  };

  fetchBits = () => {
    this.props.toggleLoader();
    API
    .get(apiName, '/bits/')
    .then(response => {
      console.log(response);

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
                  title:element.name,
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
    this.fetchBits()

    // API
    // .get(apiName, '/bits/services/')
    // .then(response => {
    //   console.log(response);
    //   this.setState({
    //     services: response,
    //   });
    // })
    // .catch(error => {
    //   console.log(error);
    // });
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
    var self = this;

    this.props.toggleLoader();

    API
    .get(apiName, `/bits/object/${node.node.id}/${node.node.service}`)
    .then(response => {
      console.log(response);
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
        content:''
      }
    });
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
    this.props.toggleLoader();
    var self = this;
    const rawContentState = convertToRaw(this.context.bitEditorState.getCurrentContent());
    const html = draftToHtml(rawContentState);
    console.log(html);

    var currBit = this.state.currBit

    currBit.content = html

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
      currBit,
      categories,
      services
    } = this.state;

    const customSearchMethod = ({  node, path, treeIndex, searchQuery }) => {
      //return false;
      return searchQuery && 
      node.data && 
      (node.title.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1 ||
      node.data.content.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1);
    }

    // const services = this.state.services.map((service) =>
    //     <MenuItem value={service}>{service}</MenuItem>
    // );
    
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
                        title="Delete Bacon Bit"
                        style={{
                          verticalAlign: "middle"
                        }}
                        onClick={() => this.handleDeleteClick(rowInfo)}
                      >
                        <Delete fontSize="small" color="error"/>
                      </button>
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
                <TextField {...params} label="Service" />
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
                <TextField {...params} label="Category" />
              )}
            />
            
            <TextField className="formControl" id="input-title" label="Title" value={currBit.name} onChange={this.handleTitleChange} />
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
