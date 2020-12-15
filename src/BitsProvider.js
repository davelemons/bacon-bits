import React, { Component }  from 'react';
import BitsContext from './BitsContext';
import { EditorState, ContentState } from 'draft-js';
import htmlToDraft from 'html-to-draftjs';

class BitsProvider extends Component {
    state = {
        selectedBits: [],
        sortedBits: [],
        editorState: EditorState.createEmpty(),
        bitEditorState: EditorState.createEmpty()
    };

    render() {
        return (
            <BitsContext.Provider
                value={{
                    selectedBits: this.state.selectedBits,
                    sortedBits: this.state.sortedBits,
                    editorState: this.state.editorState,
                    bitEditorState: this.state.bitEditorState,
                    setSelectedBits: (selectedBits) => {
                      //Build Editor HTML
                      var content = '';
                      selectedBits.forEach(bit => {
                          if(bit.data && bit.data.content) content += '<p>' + bit.data.content + '</p>';
                          bit.subtitle = `${bit.data.service} - ${bit.data.category}`;
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
                    },
                    setBitEditorState: (bitEditorState) => {
                        this.setState({
                            bitEditorState
                        });
                    },
                    setBitEditorStateFromHTML:(html) => {
                        const blocksFromHtml = htmlToDraft(html);
                        const { contentBlocks, entityMap } = blocksFromHtml;
                        const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
                        const bitEditorState = EditorState.createWithContent(contentState);
                        this.setState({
                          bitEditorState
                        });
                    },
                    clearBitEditorState:() => {
                        this.setState({
                          bitEditorState: EditorState.createEmpty()
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