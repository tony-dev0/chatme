export const LoginStart = () => ({
  type: "LOGIN_START",
});

export const LoginSuccess = (user: any) => ({
  type: "LOGIN_SUCCESS",
  payload: user,
});

export const LoginFailure = () => ({
  type: "LOGIN_FAILURE",
});

export const AcceptFriendRequest = (userId: any) => ({
  type: "ACCEPT_REQUEST",
  payload: userId,
});

export const DeclineFriendRequest = (userId: any) => ({
  type: "DECLINE_REQUEST",
  payload: userId,
});
