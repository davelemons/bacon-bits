import React, { Component }  from 'react';

import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import BitsContext from './BitsContext';


class BitEditor extends Component {
  constructor(props) {
    super(props);
    this.onChange = editorState => this.context.setBitEditorState(editorState);
  }

  static contextType = BitsContext;

  render() {

    return (
      <div>
        <Editor
          editorState={this.context.bitEditorState}
          onEditorStateChange={this.onChange}
          wrapperClassName="biteditor-wrapper-class"
          editorClassName="biteditor-class"
        />
      </div>
    );
  }
}
export default BitEditor
