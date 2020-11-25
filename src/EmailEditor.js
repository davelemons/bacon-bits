import React, { Component }  from 'react';

import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import BitsContext from './BitsContext';
import './EmailEditor.css';


class EmailEditor extends Component {
  constructor(props) {
    super(props);
    this.onChange = editorState => this.context.setEditorState(editorState);
  }

  static contextType = BitsContext;

  render() {

    return (
      <Editor
        editorState={this.context.editorState}
        onEditorStateChange={this.onChange}
      />
    );
  }
}
export default EmailEditor
