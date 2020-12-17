import React, { Component }  from 'react';
import SortableTree, { toggleExpandedForAll }  from 'react-sortable-tree';
import 'react-sortable-tree/style.css';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import BitsContext from './BitsContext';
import './BitSorter.css';
import { Info } from '@material-ui/icons';
const HtmlToReactParser = require('html-to-react').Parser;
const htmlToReactParser = new HtmlToReactParser();


const HtmlTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 400,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9'
  }
}))(Tooltip);

export default class BitSorter extends Component {
  constructor(props) {
    super(props);
 
    this.state = {
      selectedBits: []
    };
  }

  static contextType = BitsContext;

  handleTreeOnChange = selectedBits => {
    this.context.setSelectedBits(selectedBits);
  };

  render() {
    const {
      selectedBits,
    } = this.state;

    return (
      <div>
        <div className="bitsorter-tree-wrapper">
          <SortableTree
            treeData={this.context.selectedBits}
            onChange={this.handleTreeOnChange}
            generateNodeProps={(rowInfo) => {
              const { node } = rowInfo;
              return {
                buttons: [
                  node.data ? (
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
                  ) :
                  (
                    null
                  )
                ]
              };
            }}
            isVirtualized={true}
          />
        </div>
      </div>
    );
  }
}
