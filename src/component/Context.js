import React, { Component } from 'react';

const UserContext = React.createContext();

class UserProvider extends Component {
    // Context state
    state = {
        url: '/',
        filter: null,
        user: null,
        data: null,
        year: [],
    };
    // Method to update state
    setTheme = async theme => {
        this.setState(
            {
                theme: theme ? 'dark' : 'light',
            }
        );
    };
    
    setFilter = filter => {
        this.setState(prevState => ({ filter }));
    };
    setUser = user => {
        this.setState(prevState => ({ user }));
    };
    setYear = year => {
        this.setState(prevState => ({ year }));
    };
    //
    render() {
        const { children } = this.props;
        const { url, theme, filter, user, year } = this.state;
        const { setTheme, setFilter, setUser, setYear } = this;

        return (
            <UserContext.Provider
                value={{
                    theme,
                    url,
                    filter,
                    user,
                    year,
                    setTheme,
                    setFilter,
                    setUser,
                    setYear
                }}>
                {children}
            </UserContext.Provider>
        );
    }
}

export default UserContext;

export { UserProvider };
