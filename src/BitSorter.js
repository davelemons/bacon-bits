import React, { Component }  from 'react';
import { Container, Draggable } from "react-smooth-dnd";
import arrayMove from "array-move";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import DragHandleIcon from "@material-ui/icons/DragHandle";
import UndoIcon from "@material-ui/icons/Undo";
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
  }

  static contextType = BitsContext;

  render() {

    const onDrop = ({ removedIndex, addedIndex }) => {
      var selectedBits = arrayMove(this.context.selectedBits, removedIndex, addedIndex)
      this.context.setSelectedBits(selectedBits);
    };

   const handleUndoClick = (node) => {
      //console.log('Undo Bit');
      var selectedBits = []
      this.context.selectedBits.forEach(bit => {
        if (bit.id !== node.data.id){
          selectedBits.push(bit);
        }
      });
      this.context.setSelectedBits(selectedBits);
    };
    
    return (
      <List>
      <Container dragHandleSelector=".drag-handle" lockAxis="y" onDrop={onDrop}>
        {this.context.selectedBits.map(({ id, title, subtitle, data }) => (
          <Draggable key={id}>
            <ListItem dense  className={data.internal && data.internal === "true" ? 'internalNode' : ''}>
              <ListItemIcon className="drag-handle">
              <DragHandleIcon />
              </ListItemIcon>
              <ListItemText primary={title} secondary={subtitle} />
                  <ListItemSecondaryAction>
                      <button
                        className="btn btn-outline-success"
                        title="Deselect Bacon Bit"
                        style={{
                          verticalAlign: "middle",
                          marginLeft: "5px"
                        }}
                        onClick={() => handleUndoClick({data})}
                      >
                        <UndoIcon fontSize="small" color="primary"/>
                      </button>
                      <HtmlTooltip
                            title={
                              <React.Fragment>
                                {htmlToReactParser.parse(`${data.content}<span style="font-size:10px;color:#505050"><hr />Created By: ${data.createdby || data.createdBy} Last Modified By: ${data.modifiedby || data.modifiedBy}</span>`)}
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
          </Draggable>
        ))}
      </Container>
    </List>
    );
  }
}
