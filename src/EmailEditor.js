import React, { Component }  from 'react';

import { Editor } from "react-draft-wysiwyg";
import { Button } from '@material-ui/core';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import BitsContext from './BitsContext';
import './EmailEditor.css';
import draftToMarkdown from 'draftjs-to-markdown';
import draftToHtml from 'draftjs-to-html';
import { convertToRaw } from 'draft-js';


class EmailEditor extends Component {
  constructor(props) {
    super(props);
    this.onChange = editorState => this.context.setEditorState(editorState);
  }

  static contextType = BitsContext;


  copyHTML = () => {
    const self = this;
    console.log("copyHTML");
    const rawContentState = convertToRaw(this.context.editorState.getCurrentContent());
    const html = draftToHtml(rawContentState);

    console.log(html);

    navigator.clipboard.writeText(html).then(
      () => {
        self.props.addNotification({
          message: 'Copied HTML to Clipboard',
          level: 'success'
        });
      },
      error => {
        self.props.addNotification({
          message: 'There was an error copying HTML to clipboard',
          level: 'error'
        });
      }
    );


  };

  copyMarkdown = () => {
    const self = this;
    console.log("copyMarkdown");

    const rawContentState = convertToRaw(this.context.editorState.getCurrentContent());
    const markdown = draftToMarkdown(rawContentState);

    navigator.clipboard.writeText(markdown).then(
      () => {
        self.props.addNotification({
          message: 'Copied Markdown to Clipboard',
          level: 'success'
        });
      },
      error => {
        self.props.addNotification({
          message: 'There was an error copying Markdown to clipboard',
          level: 'error'
        });
      }
    );
 
    // this.props.addNotification({
    //   message: 'Copied Markdown to Clipboard',
    //   level: 'success',
    //   // action: {
    //   //   label: 'OK',
    //   //   callback: function() {
    //   //     that.okButtonClick();
    //   //   }
    //   // }
    // });
  };

  // okButtonClick = () => {
  //   console.log('OK button clicked!');
  // }

  render() {

    return (
      <div>
        <div className="button-wrapper">
          <Button className="button" variant="contained" onClick={this.copyHTML}>Copy as HTML</Button> 
          <Button className="button" variant="contained" onClick={this.copyMarkdown}>Copy as Markdown</Button>
        </div>
        <div>
          <Editor
            editorState={this.context.editorState}
            onEditorStateChange={this.onChange}
            wrapperClassName="editor-wrapper-class"
            editorClassName="editor-class"
          />
        </div>
      </div>
    );
  }
}
export default EmailEditor
