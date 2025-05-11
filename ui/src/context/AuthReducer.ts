const AuthReducer = (state: any, action: { type: any; payload: any }) => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        user: null,
        isFetching: true,
        error: false,
      };
    case "LOGIN_SUCCESS":
      return {
        user: action.payload,
        isFetching: false,
        error: false,
      };
    case "LOGIN_FAILURE":
      return {
        user: null,
        isFetching: false,
        error: true,
      };
    case "ACCEPT_REQUEST":
      return {
        ...state,
        user: {
          ...state.user,
          friends: [...state.user.friends, action.payload],
          friendRequests: state.user.friendRequests.filter(
            (friend: any) => friend !== action.payload
          ),
        },
      };
    case "DECLINE_REQUEST":
      return {
        ...state,
        user: {
          ...state.user,
          friendRequests: state.user.friendRequests.filter(
            (friend: any) => friend !== action.payload
          ),
        },
      };
    default:
      return state;
  }
};

export default AuthReducer;
