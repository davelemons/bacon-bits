import React, { Component }  from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import BitsContext from './BitsContext';
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

export default class BitSearcher extends Component {
  constructor(props) {
    super(props);
 
    this.state = {
      foundBits: []
    };
  }

  static contextType = BitsContext;


  render() {
    const {
      foundBits,
    } = this.state;

    return (
      <div>
        
      </div>
    );
  }
}
