import React, { Component }  from 'react';
import { API } from "aws-amplify"
import SortableTree, { toggleExpandedForAll }  from 'react-sortable-tree';
import 'react-sortable-tree/style.css';
import './Bits.css';
const apiName = 'baconbitsapi';
const path = '/bits/'; 

const alertNodeInfo = ({ node, path, treeIndex }) => {
  const objectString = Object.keys(node)
    .map((k) => (k === "children" ? "children: Array" : `${k}: '${node[k]}'`))
    .join(",\n   ");

  global.alert(
    "Info passed to the button generator:\n\n" +
      `node: {\n   ${objectString}\n},\n` +
      `path: [${path.join(", ")}],\n` +
      `treeIndex: ${treeIndex}`
  );
};

export default class Bits extends Component {
  constructor(props) {
    super(props);
 
    this.state = {
      treeData: [
        { title: 'Chicken', children: [{ title: 'Egg' }] },
        { title: 'Fish', children: [{ title: 'fingerline' }] },
      ],
      searchString: "",
      searchFocusIndex: -1,
      searchFoundCount: 0,
      nodeClicked: false
    };
  }

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
          tempBit.data = element;
          tempBit.children = [];
          tempBit.children.push({title:element.category});
          newTreeData.push(tempBit)
          currService = element.service;
        } else {
          tempBit.children.push({title:element.category});
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
    this.setState({
      nodeClicked: node
    });
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
          <label>Search: </label>
          <input onChange={this.handleSearchOnChange} />
          <button className="previous" onClick={this.selectPrevMatch}>
            Previous
          </button>
          <button className="next" onClick={this.selectNextMatch}>
            Next
          </button>
          <label>
            {searchFocusIndex} / {searchFoundCount}
          </label>
          <div>
            <button onClick={this.toggleNodeExpansion.bind(this, true)}>
              Expand
            </button>
            <button
              className="collapse"
              onClick={this.toggleNodeExpansion.bind(this, false)}
            >
              Collapse
            </button>
          </ div>
        </div>
        <div className="tree-wrapper">
          <SortableTree
            treeData={treeData}
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
                  <button
                    className="btn btn-outline-success"
                    style={{
                      verticalAlign: "middle"
                    }}
                    onClick={() => alertNodeInfo(rowInfo)}
                  >
                    ℹ
                  </button>
                ],
                onClick: () => {
                  this.handleNodeClick(node);
                },
                style:
                  node === this.state.nodeClicked
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
