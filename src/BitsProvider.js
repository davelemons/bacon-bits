import React, { Component }  from 'react';
import BitsContext from './BitsContext';
import { EditorState, ContentState } from 'draft-js';
import htmlToDraft from 'html-to-draftjs';

class BitsProvider extends Component {
    state = {
        selectedBits: [],
        sortedBits: [],
        editorState: EditorState.createEmpty()
    };

    render() {
        return (
            <BitsContext.Provider
                value={{
                    selectedBits: this.state.selectedBits,
                    sortedBits: this.state.sortedBits,
                    editorState: this.state.editorState,
                    setSelectedBits: (selectedBits) => {
                      //Build Editor HTML
                      var content = '';
                      selectedBits.forEach(bit => {
                          content += '<p>' + bit.data.content + '</p>'
                      });
                      const blocksFromHtml = htmlToDraft(content);
                      const { contentBlocks, entityMap } = blocksFromHtml;
                      const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
                      const editorState = EditorState.createWithContent(contentState);
                      this.setState({
                        selectedBits,
                          editorState
                      });
                    },
                    setEditorState: (editorState) => {
                        this.setState({
                            editorState
                        });
                    }
                }}
            >
                {this.props.children}
            </BitsContext.Provider>
        );
    }
}

export default BitsProvider;