import React, { Component }  from 'react';
import { API } from "aws-amplify"
import SortableTree, { toggleExpandedForAll }  from 'react-sortable-tree';
import 'react-sortable-tree/style.css';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { Button, TextField } from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
import BitsContext from './BitsContext';
import { SkipPrevious, SkipNext, ExpandLess, ExpandMore } from '@material-ui/icons';
import './Bits.css';
const HtmlToReactParser = require('html-to-react').Parser;
const htmlToReactParser = new HtmlToReactParser();

const apiName = 'baconbitsapi';
const path = '/bits/'; 

const alertNodeInfo = ({ node, path, treeIndex }) => {
  const objectString = Object.keys(node)
    .map((k) => (k === "children" ? "children: Array" : `${k}: '${node[k]}'`))
    .join(",\n   ");

  global.alert(
    node.data.content
  );
};

const HtmlTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 400,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9'
  }
}))(Tooltip);

export default class Bits extends Component {
  constructor(props) {
    super(props);
 
    this.state = {
      treeData: [
        // { title: 'SES', id: '1', selected: false, children: [{ title: 'SPF', id: '3',  selected: false, data: {content: "<strong>Configuring SPF in SES</strong><p><a href='https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-authentication-spf.html'>https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-email-authentication-spf.html</a></p>"} }] },
        // { title: 'Pinpoint', id: '2', selected: false, children: [{ title: 'Compliance & Certifications', id: '4',  selected: false, data: {content: "<strong>Pinpoint Compliance and Certifications</strong><p><a href='https://aws.amazon.com/compliance/services-in-scope'>https://aws.amazon.com/compliance/services-in-scope</a></p>"} }] },
      ],
      searchString: "",
      searchFocusIndex: -1,
      searchFoundCount: 0,
      nodeClicked: false,
      selectedNodes:[]
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

  componentDidMount() {
    API
    .get(apiName, path)
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
            id: element.id,
            data: element
          });
          newTreeData.push(tempBit)
          currService = element.service;
        } else {
          tempBit.children.push({
            title:element.category,
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
      searchFoundCount
    } = this.state;

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
          <label>
            {searchFocusIndex} / {searchFoundCount}
          </label>

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
            canDrag={false}
            onChange={this.handleTreeOnChange}
            searchQuery={searchString}
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
                        verticalAlign: "middle"
                      }}
                      onClick={() => alertNodeInfo(rowInfo)}
                    >
                      ℹ
                    </button>
                  </HtmlTooltip>
                  ) :
                  (
                    null
                  )
                ],
                onClick: (event) => {
                  if(event.target.className.includes('collapseButton') || event.target.className.includes('expandButton')) {
                    // Ignore the onlick, or do something different as the (+) or (-) button has been clicked.
                  }
                  else {
                    this.handleNodeClick(node);
                  }
                },
                style:
                  node.selected
                    ? {
                        border: "3px solid yellow"
                      }
                    : {}
              };
            }}
            isVirtualized={true}
          />
        </div>
      </div>
    );
  }
}
