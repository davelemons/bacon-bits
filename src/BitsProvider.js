import React, { Component }  from 'react';
import BitsContext from './BitsContext';
import { EditorState, ContentState } from 'draft-js';
import htmlToDraft from 'html-to-draftjs';

class BitsProvider extends Component {
    state = {
        selectedBits: [],
        sortedBits: [],
        editorState: EditorState.createEmpty(),
        bitEditorState: EditorState.createEmpty(),
        user: {},
        alias: '',
        groups: [],
        isAdmin: false
    };

    render() {
        return (
            <BitsContext.Provider
                value={{
                    selectedBits: this.state.selectedBits,
                    sortedBits: this.state.sortedBits,
                    editorState: this.state.editorState,
                    bitEditorState: this.state.bitEditorState,
                    user: this.state.user,
                    alias: this.state.alias,
                    groups: this.state.groups,
                    isAdmin: this.state.isAdmin,
                    setSelectedBits: (selectedBits) => {
                      //Build Editor HTML
                      console.log("Dave1");
                      var content = '';
                      selectedBits.forEach(bit => {
                          if(bit.data && bit.data.content) content += '' + bit.data.content + '<p></p>';
                          bit.subtitle = `${bit.data.service} - ${bit.data.category}`;
                      });
                      const blocksFromHtml = htmlToDraft(content);
                      const { contentBlocks, entityMap } = blocksFromHtml;
                      const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
                      const editorState = EditorState.createWithContent(contentState);
                      console.log(selectedBits);
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
                    },
                    setUser: (cognitoUser) => {
                        var user = cognitoUser.attributes.email;
                        var alias = ''
                        if(user){
                            var tempArray = user.split('@')
                            if (tempArray.length === 2){
                                alias = tempArray[0];
                            }
                        }
                        var groups = cognitoUser.signInUserSession.accessToken.payload["cognito:groups"];
                        var isAdmin = groups.indexOf('Admin') > -1;
                        this.setState({
                            user,
                            alias,
                            groups,
                            isAdmin
                        });
                    },
                }}
            >
                {this.props.children}
            </BitsContext.Provider>
        );
    }
}

export default BitsProvider;