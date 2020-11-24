import React, { Component }  from 'react';
import MyContext from './MyContext';

class MyProvider extends Component {
    state = {
        selectedBits: ["Dave","Was","Here"],
        sortedBits: []
    };

    render() {
        return (
            <MyContext.Provider
                value={{
                    selectedBits: this.state.selectedBits,
                    sortedBits: this.state.sortedBits,
                    setSelectedBits: (selectedBits) => {
                        this.setState({
                            selectedBits
                        });
                    },
                    setSortedBits: (sortedBits) => {
                        this.setState({
                            sortedBits
                        });
                    }
                }}
            >
                {this.props.children}
            </MyContext.Provider>
        );
    }
}

export default MyProvider;